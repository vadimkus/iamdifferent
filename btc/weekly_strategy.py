#!/usr/bin/env python3
"""
Weekly BTC Friday Trading Strategy — Tiered System
=====================================================
Backtests a tiered Friday strategy across 10yr daily data.
Every Friday is tradeable — tier determines TP/SL sizing.

Tier 1 (HIGH):   5+ of 7 strict conditions → wider TP, ~5-10/yr
Tier 2 (MEDIUM): 3+ of 5 relaxed conditions → moderate TP, ~20-25/yr
Tier 3 (BASE):   every remaining Friday → tight TP, remainder

Output: btc/weekly_strategy_results.json
"""

import json, os, warnings, functools
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings('ignore')
print = functools.partial(print, flush=True)

FOMC_DATES = [
    '2016-01-27','2016-03-16','2016-04-27','2016-06-15','2016-07-27','2016-09-21','2016-11-02','2016-12-14',
    '2017-02-01','2017-03-15','2017-05-03','2017-06-14','2017-07-26','2017-09-20','2017-11-01','2017-12-13',
    '2018-01-31','2018-03-21','2018-05-02','2018-06-13','2018-08-01','2018-09-26','2018-11-08','2018-12-19',
    '2019-01-30','2019-03-20','2019-05-01','2019-06-19','2019-07-31','2019-09-18','2019-10-30','2019-12-11',
    '2020-01-29','2020-03-15','2020-04-29','2020-06-10','2020-07-29','2020-09-16','2020-11-05','2020-12-16',
    '2021-01-27','2021-03-17','2021-04-28','2021-06-16','2021-07-28','2021-09-22','2021-11-03','2021-12-15',
    '2022-01-26','2022-03-16','2022-05-04','2022-06-15','2022-07-27','2022-09-21','2022-11-02','2022-12-14',
    '2023-02-01','2023-03-22','2023-05-03','2023-06-14','2023-07-26','2023-09-20','2023-11-01','2023-12-13',
    '2024-01-31','2024-03-20','2024-05-01','2024-06-12','2024-07-31','2024-09-18','2024-11-07','2024-12-18',
    '2025-01-29','2025-03-19','2025-05-07','2025-06-18','2025-07-30','2025-09-17','2025-10-29','2025-12-17',
    '2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-07-29','2026-09-16','2026-10-28','2026-12-16',
]
FOMC_SET = set(pd.to_datetime(FOMC_DATES).date)

MAG7_EARNINGS_WINDOWS = [
    ('2024-01-25','2024-01-25'), ('2024-02-01','2024-02-01'), ('2024-04-25','2024-04-25'),
    ('2024-05-02','2024-05-02'), ('2024-07-23','2024-07-25'), ('2024-10-29','2024-10-31'),
    ('2025-01-28','2025-01-30'), ('2025-04-29','2025-05-01'), ('2025-07-22','2025-07-24'),
    ('2025-10-28','2025-10-30'), ('2026-01-27','2026-01-29'), ('2026-04-28','2026-04-30'),
]

LUNAR_ECLIPSES = ['2024-03-25','2024-09-18','2025-03-14','2025-09-07','2026-03-03','2026-08-28']
SOLAR_ECLIPSES = ['2024-04-08','2024-10-02','2025-03-29','2025-09-21','2026-02-17','2026-08-12']
ALL_ECLIPSES_SET = set(pd.to_datetime(LUNAR_ECLIPSES + SOLAR_ECLIPSES).date)


def near_window(dt, date_set, window=3):
    d = dt.date() if hasattr(dt, 'date') else dt
    for e in date_set:
        if abs((d - e).days) <= window:
            return True
    return False


def near_earnings(dt):
    d = dt.date() if hasattr(dt, 'date') else dt
    for s, e in MAG7_EARNINGS_WINDOWS:
        sd, ed = pd.Timestamp(s).date(), pd.Timestamp(e).date()
        if sd - timedelta(days=3) <= d <= ed + timedelta(days=3):
            return True
    return False


def fetch_data():
    print("=" * 70)
    print("WEEKLY FRIDAY STRATEGY — TIERED SYSTEM BACKTEST")
    print("=" * 70)

    tickers = {
        'BTC': ('BTC-USD', '10y', '1d'),
        'DXY': ('DX-Y.NYB', '10y', '1d'),
        'VIX': ('^VIX', '10y', '1d'),
        'SPX': ('^GSPC', '10y', '1d'),
        'GLD': ('GC=F', '10y', '1d'),
    }
    data = {}
    for i, (name, (ticker, period, interval)) in enumerate(tickers.items(), 1):
        print(f"[{i}/{len(tickers)}] Fetching {name} ({ticker})...")
        df = yf.download(ticker, period=period, interval=interval, progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[0] for c in df.columns]
        data[name] = df
        print(f"  {len(df)} bars: {df.index[0].date()} → {df.index[-1].date()}")

    return data


def build_friday_df(data):
    """Build a DataFrame of all Fridays with conditions and forward prices."""
    btc = data['BTC']
    dxy = data['DXY']
    vix = data['VIX']
    spx = data['SPX']
    gld = data['GLD']

    # Compute indicators on full BTC daily
    btc['vol_20avg'] = btc['Volume'].rolling(20).mean()
    btc['vol_ratio'] = btc['Volume'] / btc['vol_20avg']

    delta = btc['Close'].diff()
    gain = delta.clip(lower=0).ewm(span=14, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(span=14, adjust=False).mean()
    btc['rsi14'] = 100 - (100 / (1 + gain / loss))

    btc['sma50'] = btc['Close'].rolling(50).mean()
    btc['sma200'] = btc['Close'].rolling(200).mean()
    btc['ema20'] = btc['Close'].ewm(span=20).mean()

    # BTC weekly return (Mon-Fri context)
    btc['weekly_ret'] = btc['Close'].pct_change(5) * 100

    # DXY
    dxy['dxy_chg'] = dxy['Close'].pct_change() * 100
    dxy['dxy_5d_chg'] = dxy['Close'].pct_change(5) * 100

    # SPX
    spx['spx_ret'] = spx['Close'].pct_change() * 100
    spx['spx_5d_ret'] = spx['Close'].pct_change(5) * 100

    # Gold
    gld['gld_ret'] = gld['Close'].pct_change() * 100

    # Filter to Fridays only
    fridays = btc[btc.index.dayofweek == 4].copy()

    all_dates = btc.index.tolist()
    date_to_idx = {d: i for i, d in enumerate(all_dates)}

    rows = []
    for fri_date in fridays.index:
        idx = date_to_idx.get(fri_date)
        if idx is None or idx + 5 >= len(all_dates):
            continue

        r = {}
        r['date'] = fri_date
        r['entry_price'] = float(btc['Close'].iloc[idx])
        r['volume'] = float(btc['Volume'].iloc[idx])
        r['vol_ratio'] = float(btc['vol_ratio'].iloc[idx]) if pd.notna(btc['vol_ratio'].iloc[idx]) else None
        r['rsi14'] = float(btc['rsi14'].iloc[idx]) if pd.notna(btc['rsi14'].iloc[idx]) else None
        r['above_sma200'] = bool(btc['Close'].iloc[idx] > btc['sma200'].iloc[idx]) if pd.notna(btc['sma200'].iloc[idx]) else None
        r['above_sma50'] = bool(btc['Close'].iloc[idx] > btc['sma50'].iloc[idx]) if pd.notna(btc['sma50'].iloc[idx]) else None
        r['above_ema20'] = bool(btc['Close'].iloc[idx] > btc['ema20'].iloc[idx]) if pd.notna(btc['ema20'].iloc[idx]) else None
        r['weekly_ret'] = float(btc['weekly_ret'].iloc[idx]) if pd.notna(btc['weekly_ret'].iloc[idx]) else None

        # Cross-asset
        dxy_row = dxy.reindex([fri_date], method='ffill')
        r['dxy_chg'] = float(dxy_row['dxy_chg'].iloc[0]) if len(dxy_row) and pd.notna(dxy_row['dxy_chg'].iloc[0]) else None
        r['dxy_5d_chg'] = float(dxy_row['dxy_5d_chg'].iloc[0]) if len(dxy_row) and pd.notna(dxy_row['dxy_5d_chg'].iloc[0]) else None

        vix_row = vix.reindex([fri_date], method='ffill')
        r['vix'] = float(vix_row['Close'].iloc[0]) if len(vix_row) and pd.notna(vix_row['Close'].iloc[0]) else None

        spx_row = spx.reindex([fri_date], method='ffill')
        r['spx_ret'] = float(spx_row['spx_ret'].iloc[0]) if len(spx_row) and pd.notna(spx_row['spx_ret'].iloc[0]) else None
        r['spx_5d_ret'] = float(spx_row['spx_5d_ret'].iloc[0]) if len(spx_row) and pd.notna(spx_row['spx_5d_ret'].iloc[0]) else None

        gld_row = gld.reindex([fri_date], method='ffill')
        r['gld_ret'] = float(gld_row['gld_ret'].iloc[0]) if len(gld_row) and pd.notna(gld_row['gld_ret'].iloc[0]) else None

        # Events
        r['near_fomc'] = near_window(fri_date, FOMC_SET, 3)
        r['near_earnings'] = near_earnings(fri_date)
        r['near_eclipse'] = near_window(fri_date, ALL_ECLIPSES_SET, 2)
        r['month'] = fri_date.month

        # Forward prices (1-5 days)
        for d in range(1, 6):
            if idx + d < len(all_dates):
                r[f'fwd_{d}d_high'] = float(btc['High'].iloc[idx + 1:idx + d + 1].max())
                r[f'fwd_{d}d_low'] = float(btc['Low'].iloc[idx + 1:idx + d + 1].min())
                r[f'fwd_{d}d_close'] = float(btc['Close'].iloc[idx + d])

        rows.append(r)

    fdf = pd.DataFrame(rows)

    # ---- BUILD CONDITION FLAGS ----

    # TIER 1 strict conditions (must all be rare individually)
    fdf['c_vol_very_low'] = fdf['vol_ratio'].apply(lambda x: x < 0.6 if pd.notna(x) else False)
    fdf['c_dxy_flat'] = fdf['dxy_chg'].apply(lambda x: abs(x) < 0.2 if pd.notna(x) else False)
    fdf['c_vix_calm'] = fdf['vix'].apply(lambda x: x < 18 if pd.notna(x) else False)
    fdf['c_rsi_sweet'] = fdf['rsi14'].apply(lambda x: 40 <= x <= 55 if pd.notna(x) else False)
    fdf['c_above_sma200'] = fdf['above_sma200'].apply(lambda x: bool(x) if pd.notna(x) else False)
    fdf['c_no_events'] = ~fdf['near_fomc'] & ~fdf['near_earnings'] & ~fdf['near_eclipse']
    fdf['c_btc_green_week'] = fdf['weekly_ret'].apply(lambda x: x > 0 if pd.notna(x) else False)

    t1_cols = ['c_vol_very_low', 'c_dxy_flat', 'c_vix_calm', 'c_rsi_sweet', 'c_above_sma200', 'c_no_events', 'c_btc_green_week']
    fdf['t1_score'] = fdf[t1_cols].sum(axis=1)

    # TIER 2 relaxed conditions
    fdf['c_vol_below_avg'] = fdf['vol_ratio'].apply(lambda x: x < 0.9 if pd.notna(x) else False)
    fdf['c_dxy_stable'] = fdf['dxy_chg'].apply(lambda x: abs(x) < 0.5 if pd.notna(x) else False)
    fdf['c_vix_ok'] = fdf['vix'].apply(lambda x: x < 25 if pd.notna(x) else False)
    fdf['c_rsi_range'] = fdf['rsi14'].apply(lambda x: 30 <= x <= 65 if pd.notna(x) else False)
    fdf['c_spx_stable'] = fdf['spx_ret'].apply(lambda x: x > -1.5 if pd.notna(x) else True)

    t2_cols = ['c_vol_below_avg', 'c_dxy_stable', 'c_vix_ok', 'c_rsi_range', 'c_spx_stable']
    fdf['t2_score'] = fdf[t2_cols].sum(axis=1)

    return fdf


def simulate_trades(fdf, tp_pct, sl_pct, hold_days, label=""):
    """Vectorized TP/SL simulation. Returns stats dict + trade list."""
    if len(fdf) == 0:
        return None

    entries = fdf['entry_price'].values
    n = len(entries)

    tp_prices = entries * (1 + tp_pct)
    sl_prices = entries * (1 + sl_pct)

    outcomes = np.full(n, 2, dtype=int)  # 0=tp, 1=sl, 2=hold
    exit_prices = np.copy(entries)
    exit_days = np.full(n, hold_days, dtype=int)

    for d in range(1, hold_days + 1):
        h_col = f'fwd_{d}d_high'
        l_col = f'fwd_{d}d_low'
        if h_col not in fdf.columns:
            continue

        fwd_h = fdf[h_col].values
        fwd_l = fdf[l_col].values

        if d == 1:
            prev_h = np.zeros(n)
            prev_l = np.full(n, 1e12)
        else:
            prev_h = fdf[f'fwd_{d-1}d_high'].values
            prev_l = fdf[f'fwd_{d-1}d_low'].values

        still_open = (outcomes == 2)

        hit_tp = still_open & (fwd_h >= tp_prices) & (prev_h < tp_prices)
        hit_sl = still_open & (fwd_l <= sl_prices) & (prev_l > sl_prices)

        # Both hit same day → SL (conservative)
        both = hit_tp & hit_sl
        sl_only = hit_sl & ~hit_tp
        tp_only = hit_tp & ~hit_sl

        outcomes[both] = 1
        exit_prices[both] = sl_prices[both]
        exit_days[both] = d

        outcomes[sl_only] = 1
        exit_prices[sl_only] = sl_prices[sl_only]
        exit_days[sl_only] = d

        outcomes[tp_only] = 0
        exit_prices[tp_only] = tp_prices[tp_only]
        exit_days[tp_only] = d

    # Hold exits: use final close
    holds = (outcomes == 2)
    c_col = f'fwd_{hold_days}d_close'
    if c_col in fdf.columns:
        fc = fdf[c_col].values
        valid = holds & ~np.isnan(fc)
        exit_prices[valid] = fc[valid]

    returns = (exit_prices / entries - 1) * 100
    wins = returns > 0

    n_wins = int(wins.sum())
    n_tp = int((outcomes == 0).sum())
    n_sl = int((outcomes == 1).sum())
    n_hold = int((outcomes == 2).sum())

    avg_win = float(returns[wins].mean()) if n_wins > 0 else 0
    avg_loss = float(returns[~wins].mean()) if (n - n_wins) > 0 else 0

    # Equity curve
    eq = np.cumprod(1 + returns / 100) * 10000
    running_max = np.maximum.accumulate(eq)
    drawdowns = (running_max - eq) / running_max * 100
    max_dd = float(drawdowns.max())
    cum_ret = float((eq[-1] / 10000 - 1) * 100)

    mean_ret = float(returns.mean())
    std_ret = float(returns.std())
    sharpe = (mean_ret / std_ret * np.sqrt(52)) if std_ret > 0 else 0

    # Yearly breakdown
    dates = fdf['date'].values
    years = pd.DatetimeIndex(dates).year
    yearly = []
    for y in sorted(set(years)):
        mask = years == y
        yr = returns[mask]
        ywr = float((yr > 0).sum() / len(yr) * 100)
        ycum = float((np.prod(1 + yr / 100) - 1) * 100)
        yearly.append({'year': int(y), 'trades': int(len(yr)), 'win_rate': round(ywr, 1), 'cum_return': round(ycum, 2)})

    # Build trade list (recent 30)
    trade_list = []
    outcome_names = ['tp', 'sl', 'hold_exit']
    for i in range(max(0, n - 30), n):
        trade_list.append({
            'date': str(pd.Timestamp(dates[i]).date()),
            'entry': round(float(entries[i]), 2),
            'exit': round(float(exit_prices[i]), 2),
            'return_pct': round(float(returns[i]), 4),
            'outcome': outcome_names[outcomes[i]],
        })

    return {
        'label': label,
        'tp_pct': round(tp_pct * 100, 2),
        'sl_pct': round(sl_pct * 100, 2),
        'hold_days': hold_days,
        'trades': n,
        'wins': n_wins,
        'losses': n - n_wins,
        'win_rate': round(n_wins / n * 100, 1),
        'tp_hit_rate': round(n_tp / n * 100, 1),
        'sl_hit_rate': round(n_sl / n * 100, 1),
        'hold_exit_rate': round(n_hold / n * 100, 1),
        'avg_win': round(avg_win, 4),
        'avg_loss': round(avg_loss, 4),
        'expectancy': round(mean_ret, 4),
        'cum_return': round(cum_ret, 2),
        'max_drawdown': round(max_dd, 2),
        'sharpe': round(sharpe, 2),
        'yearly': yearly,
        'trades_per_year': round(n / max(1, len(yearly)), 1),
        'recent_trades': trade_list,
    }


def run_full_scan(fdf):
    """Exhaustive TP/SL scan per tier."""
    print("\n" + "=" * 70)
    print("EXHAUSTIVE TP / SL SCAN PER TIER")
    print("=" * 70)

    # Tier definitions with thresholds to aim for the right frequency
    # Tier 1: very strict → ~5-15 Fridays/year
    t1_thresholds = [5, 6]
    # Tier 2: moderate → ~15-30 Fridays/year
    t2_thresholds = [4, 5]

    tp_sl_combos = [
        # (tp, sl, hold, label_prefix)
        (0.002, -0.004, 1, "TP+0.2% SL-0.4% 1d"),
        (0.003, -0.005, 1, "TP+0.3% SL-0.5% 1d"),
        (0.003, -0.006, 1, "TP+0.3% SL-0.6% 1d"),
        (0.004, -0.006, 1, "TP+0.4% SL-0.6% 1d"),
        (0.004, -0.008, 1, "TP+0.4% SL-0.8% 1d"),
        (0.005, -0.008, 1, "TP+0.5% SL-0.8% 1d"),
        (0.005, -0.010, 1, "TP+0.5% SL-1.0% 1d"),
        (0.003, -0.005, 2, "TP+0.3% SL-0.5% 2d"),
        (0.004, -0.007, 2, "TP+0.4% SL-0.7% 2d"),
        (0.005, -0.008, 2, "TP+0.5% SL-0.8% 2d"),
        (0.005, -0.010, 2, "TP+0.5% SL-1.0% 2d"),
        (0.007, -0.010, 2, "TP+0.7% SL-1.0% 2d"),
        (0.007, -0.012, 2, "TP+0.7% SL-1.2% 2d"),
        (0.008, -0.012, 2, "TP+0.8% SL-1.2% 2d"),
        (0.010, -0.015, 2, "TP+1.0% SL-1.5% 2d"),
        (0.010, -0.015, 3, "TP+1.0% SL-1.5% 3d"),
        (0.010, -0.020, 3, "TP+1.0% SL-2.0% 3d"),
        (0.012, -0.018, 3, "TP+1.2% SL-1.8% 3d"),
        (0.015, -0.020, 3, "TP+1.5% SL-2.0% 3d"),
        (0.015, -0.020, 5, "TP+1.5% SL-2.0% 5d"),
        (0.020, -0.030, 5, "TP+2.0% SL-3.0% 5d"),
    ]

    all_results = {}

    # --- TIER 1 SCAN ---
    for t1_thresh in t1_thresholds:
        t1_mask = fdf['t1_score'] >= t1_thresh
        t1_df = fdf[t1_mask]
        n_years = len(set(pd.DatetimeIndex(t1_df['date']).year))
        tpy = len(t1_df) / max(1, n_years)
        tag = f"T1 (>={t1_thresh}/7)"
        print(f"\n--- {tag}: {len(t1_df)} Fridays ({tpy:.1f}/yr) ---")

        results = []
        for tp, sl, hold, lbl in tp_sl_combos:
            r = simulate_trades(t1_df, tp, sl, hold, f"{tag} {lbl}")
            if r:
                results.append(r)
        results.sort(key=lambda x: x['win_rate'], reverse=True)

        for r in results[:5]:
            print(f"  {r['label']:45s} | WR={r['win_rate']:5.1f}% | n={r['trades']:4d} | exp={r['expectancy']:+.4f}% | Sh={r['sharpe']:.2f}")

        all_results[f't1_{t1_thresh}'] = {
            'threshold': t1_thresh,
            'n_fridays': len(t1_df),
            'per_year': round(tpy, 1),
            'results': results,
        }

    # --- TIER 2 SCAN ---
    for t2_thresh in t2_thresholds:
        # Tier 2 = meets threshold but NOT Tier 1
        best_t1_thresh = 6  # we'll pick later
        t2_mask = (fdf['t2_score'] >= t2_thresh) & (fdf['t1_score'] < best_t1_thresh)
        t2_df = fdf[t2_mask]
        n_years = len(set(pd.DatetimeIndex(t2_df['date']).year))
        tpy = len(t2_df) / max(1, n_years)
        tag = f"T2 (>={t2_thresh}/5, not T1)"
        print(f"\n--- {tag}: {len(t2_df)} Fridays ({tpy:.1f}/yr) ---")

        results = []
        for tp, sl, hold, lbl in tp_sl_combos:
            r = simulate_trades(t2_df, tp, sl, hold, f"{tag} {lbl}")
            if r:
                results.append(r)
        results.sort(key=lambda x: x['win_rate'], reverse=True)

        for r in results[:5]:
            print(f"  {r['label']:45s} | WR={r['win_rate']:5.1f}% | n={r['trades']:4d} | exp={r['expectancy']:+.4f}% | Sh={r['sharpe']:.2f}")

        all_results[f't2_{t2_thresh}'] = {
            'threshold': t2_thresh,
            'n_fridays': len(t2_df),
            'per_year': round(tpy, 1),
            'results': results,
        }

    # --- TIER 3 (ALL FRIDAYS, no filter) SCAN ---
    print(f"\n--- TIER 3: ALL FRIDAYS ({len(fdf)}) ---")
    t3_results = []
    for tp, sl, hold, lbl in tp_sl_combos:
        r = simulate_trades(fdf, tp, sl, hold, f"T3 {lbl}")
        if r:
            t3_results.append(r)
    t3_results.sort(key=lambda x: x['win_rate'], reverse=True)

    for r in t3_results[:5]:
        print(f"  {r['label']:45s} | WR={r['win_rate']:5.1f}% | n={r['trades']:4d} | exp={r['expectancy']:+.4f}% | Sh={r['sharpe']:.2f}")

    all_results['t3_all'] = {'results': t3_results}

    return all_results


def select_best_tiers(fdf, scan_results):
    """Pick optimal tier configs and run combined simulation."""
    print("\n" + "=" * 70)
    print("SELECTING OPTIMAL TIER CONFIGURATION")
    print("=" * 70)

    def score(r, target_wr=65):
        wr_bonus = max(0, r['win_rate'] - target_wr) * 3
        return r['win_rate'] + r['expectancy'] * 50 + r['sharpe'] * 3 + wr_bonus

    # Tier 1: pick threshold that gives ~5-15/year and best score
    best_t1_cfg = None
    best_t1_score = -999
    for key in [k for k in scan_results if k.startswith('t1_')]:
        info = scan_results[key]
        if info['per_year'] < 3 or info['per_year'] > 20:
            continue
        for r in info['results']:
            if r['win_rate'] >= 65 and r['expectancy'] > 0:
                s = score(r, 70)
                if s > best_t1_score:
                    best_t1_score = s
                    best_t1_cfg = {**r, 't1_threshold': info['threshold'], 'per_year': info['per_year']}

    # If nothing meets 65%+, pick best overall
    if best_t1_cfg is None:
        for key in [k for k in scan_results if k.startswith('t1_')]:
            info = scan_results[key]
            for r in info['results']:
                if r['expectancy'] > 0:
                    s = score(r, 60)
                    if s > best_t1_score:
                        best_t1_score = s
                        best_t1_cfg = {**r, 't1_threshold': info['threshold'], 'per_year': info['per_year']}

    if best_t1_cfg is None:
        # Fallback: just pick highest WR from any t1 scan
        for key in [k for k in scan_results if k.startswith('t1_')]:
            for r in scan_results[key]['results']:
                s = r['win_rate']
                if s > best_t1_score:
                    best_t1_score = s
                    best_t1_cfg = {**r, 't1_threshold': scan_results[key]['threshold'], 'per_year': scan_results[key]['per_year']}

    t1_thresh = best_t1_cfg['t1_threshold'] if best_t1_cfg else 6

    # Tier 2: pick threshold that gives decent frequency and >60% WR
    best_t2_cfg = None
    best_t2_score = -999
    for key in [k for k in scan_results if k.startswith('t2_')]:
        info = scan_results[key]
        for r in info['results']:
            if r['win_rate'] >= 60:
                s = score(r, 65)
                if s > best_t2_score:
                    best_t2_score = s
                    best_t2_cfg = {**r, 't2_threshold': info['threshold'], 'per_year': info['per_year']}

    if best_t2_cfg is None:
        for key in [k for k in scan_results if k.startswith('t2_')]:
            for r in scan_results[key]['results']:
                s = score(r, 55)
                if s > best_t2_score:
                    best_t2_score = s
                    best_t2_cfg = {**r, 't2_threshold': scan_results[key]['threshold'], 'per_year': scan_results[key]['per_year']}

    t2_thresh = best_t2_cfg['t2_threshold'] if best_t2_cfg else 4

    # Tier 3: pick best all-Fridays config with positive or least-negative expectancy
    t3_results = scan_results['t3_all']['results']
    best_t3_cfg = max(t3_results, key=lambda r: score(r, 55))

    print(f"\n  TIER 1 (HIGH): score >= {t1_thresh}/7 ({best_t1_cfg['per_year']}/yr)")
    print(f"    Config: {best_t1_cfg['label']}")
    print(f"    WR={best_t1_cfg['win_rate']}% | Exp={best_t1_cfg['expectancy']:+.4f}% | Sharpe={best_t1_cfg['sharpe']}")

    print(f"\n  TIER 2 (MEDIUM): t2_score >= {t2_thresh}/5 and t1_score < {t1_thresh}")
    print(f"    Config: {best_t2_cfg['label']}")
    print(f"    WR={best_t2_cfg['win_rate']}% | Exp={best_t2_cfg['expectancy']:+.4f}% | Sharpe={best_t2_cfg['sharpe']}")

    print(f"\n  TIER 3 (BASE): remaining Fridays")
    print(f"    Config: {best_t3_cfg['label']}")
    print(f"    WR={best_t3_cfg['win_rate']}% | Exp={best_t3_cfg['expectancy']:+.4f}% | Sharpe={best_t3_cfg['sharpe']}")

    # --- COMBINED SIMULATION ---
    print("\n" + "=" * 70)
    print("COMBINED WEEKLY SIMULATION")
    print("=" * 70)

    combined = []
    for _, row in fdf.iterrows():
        t1s = row['t1_score']
        t2s = row['t2_score']

        if t1s >= t1_thresh:
            tier = 1
            tp = best_t1_cfg['tp_pct'] / 100
            sl = best_t1_cfg['sl_pct'] / 100
            hold = best_t1_cfg['hold_days']
        elif t2s >= t2_thresh:
            tier = 2
            tp = best_t2_cfg['tp_pct'] / 100
            sl = best_t2_cfg['sl_pct'] / 100
            hold = best_t2_cfg['hold_days']
        else:
            tier = 3
            tp = best_t3_cfg['tp_pct'] / 100
            sl = best_t3_cfg['sl_pct'] / 100
            hold = best_t3_cfg['hold_days']

        entry = row['entry_price']
        tp_price = entry * (1 + tp)
        sl_price = entry * (1 + sl)
        outcome = 'hold_exit'
        exit_price = entry

        for d in range(1, hold + 1):
            fh = row.get(f'fwd_{d}d_high')
            fl = row.get(f'fwd_{d}d_low')
            if pd.isna(fh) or pd.isna(fl):
                continue
            ph = row.get(f'fwd_{d-1}d_high', 0) if d > 1 else 0
            pl = row.get(f'fwd_{d-1}d_low', 1e12) if d > 1 else 1e12

            hit_tp = fh >= tp_price and ph < tp_price
            hit_sl = fl <= sl_price and pl > sl_price

            if hit_tp and hit_sl:
                outcome, exit_price = 'sl', sl_price
                break
            elif hit_tp:
                outcome, exit_price = 'tp', tp_price
                break
            elif hit_sl:
                outcome, exit_price = 'sl', sl_price
                break

        if outcome == 'hold_exit':
            c = row.get(f'fwd_{hold}d_close')
            if pd.notna(c):
                exit_price = c

        ret = (exit_price / entry - 1) * 100
        combined.append({
            'date': str(row['date'].date()) if hasattr(row['date'], 'date') else str(row['date']),
            'tier': tier,
            'return_pct': round(ret, 4),
            'outcome': outcome,
            'entry': round(float(entry), 2),
            'exit': round(float(exit_price), 2),
        })

    cdf = pd.DataFrame(combined)
    total = len(cdf)
    wins = int((cdf['return_pct'] > 0).sum())
    n_years = len(set(cdf['date'].str[:4]))
    tpy = total / max(1, n_years)

    print(f"\n  Total trades: {total} ({tpy:.1f}/yr)")
    print(f"  Win rate: {wins/total*100:.1f}%")
    print(f"  Expectancy: {cdf['return_pct'].mean():+.4f}%")

    tier_stats = {}
    for t in [1, 2, 3]:
        sub = cdf[cdf['tier'] == t]
        if len(sub) > 0:
            sw = (sub['return_pct'] > 0).sum()
            tier_stats[str(t)] = {
                'trades': int(len(sub)),
                'trades_per_year': round(len(sub) / max(1, n_years), 1),
                'win_rate': round(sw / len(sub) * 100, 1),
                'expectancy': round(sub['return_pct'].mean(), 4),
            }
            print(f"  Tier {t}: {len(sub)} trades ({len(sub)/n_years:.1f}/yr), WR={sw/len(sub)*100:.1f}%, exp={sub['return_pct'].mean():+.4f}%")

    # Equity curve stats
    eq = np.cumprod(1 + cdf['return_pct'].values / 100) * 10000
    running_max = np.maximum.accumulate(eq)
    drawdowns = (running_max - eq) / running_max * 100
    max_dd = float(drawdowns.max())
    cum = float((eq[-1] / 10000 - 1) * 100)

    # Yearly
    cdf['year'] = cdf['date'].str[:4].astype(int)
    yearly_combined = []
    for y, g in cdf.groupby('year'):
        yw = (g['return_pct'] > 0).sum()
        yc = ((1 + g['return_pct'] / 100).prod() - 1) * 100
        yearly_combined.append({
            'year': int(y), 'trades': len(g), 'win_rate': round(yw / len(g) * 100, 1),
            'cum_return': round(yc, 2),
            'by_tier': {str(t): int((g['tier'] == t).sum()) for t in [1, 2, 3]},
        })

    position = 270000
    annual_pnl = position * cdf['return_pct'].mean() / 100 * tpy
    print(f"\n  Cumulative return: {cum:+.2f}%")
    print(f"  Max drawdown: {max_dd:.2f}%")
    print(f"\n  === $270K ANNUAL PROJECTION ===")
    print(f"  Trades/year: ~{tpy:.0f}")
    print(f"  Expected annual P&L: ${annual_pnl:+,.0f}")
    print(f"  Expected annual ROI: {annual_pnl/position*100:+.1f}%")

    return {
        'best_tier1': best_t1_cfg,
        'best_tier2': best_t2_cfg,
        'best_tier3': best_t3_cfg,
        't1_threshold': t1_thresh,
        't2_threshold': t2_thresh,
        'combined': {
            'total_trades': total,
            'trades_per_year': round(tpy, 1),
            'n_years': n_years,
            'win_rate': round(wins / total * 100, 1),
            'expectancy': round(cdf['return_pct'].mean(), 4),
            'cum_return': round(cum, 2),
            'max_drawdown': round(max_dd, 2),
            'sharpe': round(cdf['return_pct'].mean() / cdf['return_pct'].std() * np.sqrt(52), 2) if cdf['return_pct'].std() > 0 else 0,
            'by_tier': tier_stats,
            'yearly': yearly_combined,
            'projection_270k': {
                'annual_trades': round(tpy),
                'annual_pnl': round(annual_pnl),
                'annual_roi_pct': round(annual_pnl / position * 100, 1),
            },
        },
        'tier_conditions': {
            'tier1': {
                'label': f'{t1_thresh}+ of 7 strict conditions',
                'conditions': [
                    'vol_very_low (vol < 0.6x 20d avg)',
                    'dxy_flat (|chg| < 0.2%)',
                    'vix_calm (< 18)',
                    'rsi_sweet (40-55)',
                    'above_sma200',
                    'no_events (no FOMC/earnings/eclipse within 3d)',
                    'btc_green_week (weekly return > 0)',
                ],
            },
            'tier2': {
                'label': f'{t2_thresh}+ of 5 relaxed conditions (and not T1)',
                'conditions': [
                    'vol_below_avg (vol < 0.9x 20d avg)',
                    'dxy_stable (|chg| < 0.5%)',
                    'vix_ok (< 25)',
                    'rsi_range (30-65)',
                    'spx_stable (daily ret > -1.5%)',
                ],
            },
            'tier3': {
                'label': 'Every remaining Friday',
                'conditions': ['friday'],
            },
        },
        'recent_combined_trades': combined[-30:],
    }


if __name__ == '__main__':
    data = fetch_data()
    fdf = build_friday_df(data)
    print(f"\nTotal Fridays with data: {len(fdf)}")

    # Tier distribution preview
    for thresh in range(3, 8):
        n = (fdf['t1_score'] >= thresh).sum()
        nyrs = len(set(pd.DatetimeIndex(fdf['date']).year))
        print(f"  t1_score >= {thresh}: {n} ({n/max(1,nyrs):.1f}/yr)")

    for thresh in range(2, 6):
        n = (fdf['t2_score'] >= thresh).sum()
        nyrs = len(set(pd.DatetimeIndex(fdf['date']).year))
        print(f"  t2_score >= {thresh}: {n} ({n/max(1,nyrs):.1f}/yr)")

    scan_results = run_full_scan(fdf)
    final = select_best_tiers(fdf, scan_results)

    output = {
        'generated': datetime.utcnow().isoformat(),
        **final,
    }

    out_path = os.path.join(os.path.dirname(__file__), 'weekly_strategy_results.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\nResults saved to {out_path}")
