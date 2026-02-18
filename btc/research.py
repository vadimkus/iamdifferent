#!/usr/bin/env python3
"""
BTC Strategy Deep Research & Backtesting Engine
=================================================
Systematically mines BTC/SPX/Gold/DXY/VIX + lunar/FOMC/earnings data
to find the highest win-rate multi-condition confluence strategies.

Output: btc/research_results.json
"""

import json, os, sys, warnings, itertools
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings('ignore')
pd.set_option('display.max_columns', 50)
pd.set_option('display.width', 200)

# Force unbuffered output
import functools
print = functools.partial(print, flush=True)

# ============================================================================
# EVENT DATA (mirrors src/lib/market-events.ts)
# ============================================================================

FULL_MOONS = [
    '2024-01-25','2024-02-24','2024-03-25','2024-04-23','2024-05-23','2024-06-21',
    '2024-07-21','2024-08-19','2024-09-17','2024-10-17','2024-11-15','2024-12-15',
    '2025-01-13','2025-02-12','2025-03-14','2025-04-13','2025-05-12','2025-06-11',
    '2025-07-10','2025-08-09','2025-09-07','2025-10-07','2025-11-05','2025-12-04',
    '2026-01-03','2026-02-01','2026-03-03','2026-04-01','2026-05-01','2026-05-31',
    '2026-06-29','2026-07-29','2026-08-28','2026-09-26','2026-10-26','2026-11-24','2026-12-23',
]

NEW_MOONS = [
    '2024-01-11','2024-02-09','2024-03-10','2024-04-08','2024-05-07','2024-06-06',
    '2024-07-05','2024-08-04','2024-09-02','2024-10-02','2024-11-01','2024-12-01','2024-12-30',
    '2025-01-29','2025-02-27','2025-03-29','2025-04-27','2025-05-26','2025-06-25',
    '2025-07-24','2025-08-23','2025-09-21','2025-10-21','2025-11-20','2025-12-19',
    '2026-01-18','2026-02-17','2026-03-18','2026-04-17','2026-05-16','2026-06-15',
    '2026-07-14','2026-08-12','2026-09-11','2026-10-10','2026-11-09','2026-12-09',
]

LUNAR_ECLIPSES = ['2024-03-25','2024-09-18','2025-03-14','2025-09-07','2026-03-03','2026-08-28']
SOLAR_ECLIPSES = ['2024-04-08','2024-10-02','2025-03-29','2025-09-21','2026-02-17','2026-08-12']
ALL_ECLIPSES = sorted(LUNAR_ECLIPSES + SOLAR_ECLIPSES)

FOMC_DATES = [
    '2024-01-31','2024-03-20','2024-05-01','2024-06-12','2024-07-31','2024-09-18','2024-11-07','2024-12-18',
    '2025-01-29','2025-03-19','2025-05-07','2025-06-18','2025-07-30','2025-09-17','2025-10-29','2025-12-10',
    '2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-07-29','2026-09-16','2026-10-28','2026-12-09',
]

MAG7_EARNINGS_DATES = sorted(set([
    '2024-01-25','2024-01-30','2024-02-01','2024-02-21',
    '2024-04-18','2024-04-25','2024-05-02','2024-05-22',
    '2024-07-23','2024-07-30','2024-07-31','2024-08-01','2024-08-28',
    '2024-10-23','2024-10-29','2024-10-30','2024-10-31','2024-11-20',
    '2025-01-29','2025-02-04','2025-02-06','2025-02-26',
    '2025-04-22','2025-04-29','2025-04-30','2025-05-01','2025-05-28',
    '2025-07-22','2025-07-29','2025-07-30','2025-07-31','2025-08-27',
    '2025-10-22','2025-10-28','2025-10-29','2025-10-30','2025-11-19',
    '2026-01-28','2026-02-03','2026-02-05','2026-02-25',
]))


# ============================================================================
# DATA FETCHING
# ============================================================================

def _flatten_cols(df: pd.DataFrame) -> pd.DataFrame:
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df

def fetch_all_data() -> Dict[str, pd.DataFrame]:
    """Fetch daily data for all assets. Returns dict of DataFrames."""
    assets = [
        ('btc', 'BTC-USD', '10y', '1d'),
        ('spx', '^GSPC', '10y', '1d'),
        ('gold', 'GC=F', '10y', '1d'),
        ('dxy', 'DX-Y.NYB', '10y', '1d'),
        ('vix', '^VIX', '10y', '1d'),
        ('btc_h', 'BTC-USD', '730d', '1h'),
    ]
    result = {}
    for i, (key, symbol, period, interval) in enumerate(assets, 1):
        print(f"[{i}/{len(assets)}] Fetching {symbol} ({period} {interval})...")
        df = yf.download(symbol, period=period, interval=interval, progress=False)
        df = _flatten_cols(df)
        print(f"  -> {len(df)} rows")
        result[key] = df
    print("Data fetch complete.\n")
    return result


# ============================================================================
# TECHNICAL INDICATORS
# ============================================================================

def add_indicators(df: pd.DataFrame, prefix: str = '') -> pd.DataFrame:
    """Add all technical indicators to a daily OHLCV DataFrame."""
    c = df['Close'].copy()
    h = df['High'].copy()
    l = df['Low'].copy()
    v = df['Volume'].copy() if 'Volume' in df.columns else pd.Series(0, index=df.index)

    # Returns
    df[f'{prefix}ret_1d'] = c.pct_change()
    df[f'{prefix}ret_5d'] = c.pct_change(5)
    df[f'{prefix}ret_20d'] = c.pct_change(20)

    # RSI
    for period in [7, 14]:
        delta = c.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(alpha=1/period, min_periods=period).mean()
        avg_loss = loss.ewm(alpha=1/period, min_periods=period).mean()
        rs = avg_gain / avg_loss
        df[f'{prefix}rsi_{period}'] = 100 - (100 / (1 + rs))

    # EMAs
    for span in [9, 20, 50]:
        df[f'{prefix}ema_{span}'] = c.ewm(span=span).mean()
    df[f'{prefix}sma_200'] = c.rolling(200).mean()

    # MACD
    ema12 = c.ewm(span=12).mean()
    ema26 = c.ewm(span=26).mean()
    df[f'{prefix}macd'] = ema12 - ema26
    df[f'{prefix}macd_signal'] = df[f'{prefix}macd'].ewm(span=9).mean()
    df[f'{prefix}macd_hist'] = df[f'{prefix}macd'] - df[f'{prefix}macd_signal']

    # Bollinger Bands
    sma20 = c.rolling(20).mean()
    std20 = c.rolling(20).std()
    df[f'{prefix}bb_upper'] = sma20 + 2 * std20
    df[f'{prefix}bb_lower'] = sma20 - 2 * std20
    df[f'{prefix}bb_pct'] = (c - df[f'{prefix}bb_lower']) / (df[f'{prefix}bb_upper'] - df[f'{prefix}bb_lower'])

    # ATR
    tr = pd.concat([h - l, (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    df[f'{prefix}atr_14'] = tr.rolling(14).mean()

    # Volume ratio
    if v.sum() > 0:
        df[f'{prefix}vol_ratio'] = v / v.rolling(20).mean()
    else:
        df[f'{prefix}vol_ratio'] = 1.0

    # Volatility proxy
    df[f'{prefix}range_pct'] = (h - l) / c

    # Price vs MAs
    df[f'{prefix}above_ema20'] = (c > df[f'{prefix}ema_20']).astype(int)
    df[f'{prefix}above_ema50'] = (c > df[f'{prefix}ema_50']).astype(int)
    df[f'{prefix}above_sma200'] = (c > df[f'{prefix}sma_200']).astype(int)

    return df


def add_event_flags(df: pd.DataFrame) -> pd.DataFrame:
    """Add event proximity flags to daily DataFrame."""
    dates = df.index.normalize()

    def min_days_to(event_dates, ref_dates):
        event_ts = pd.to_datetime(event_dates)
        result = []
        for d in ref_dates:
            diffs = np.abs((event_ts - d).days)
            result.append(int(diffs.min()) if len(diffs) > 0 else 999)
        return result

    df['full_moon_days'] = min_days_to(FULL_MOONS, dates)
    df['new_moon_days'] = min_days_to(NEW_MOONS, dates)
    df['eclipse_days'] = min_days_to(ALL_ECLIPSES, dates)
    df['fomc_days'] = min_days_to(FOMC_DATES, dates)
    df['earnings_days'] = min_days_to(MAG7_EARNINGS_DATES, dates)

    df['near_full_moon'] = (df['full_moon_days'] <= 2).astype(int)
    df['near_new_moon'] = (df['new_moon_days'] <= 2).astype(int)
    df['near_eclipse'] = (df['eclipse_days'] <= 2).astype(int)
    df['fomc_window'] = (df['fomc_days'] <= 1).astype(int)
    df['fomc_pre'] = ((df['fomc_days'] >= 2) & (df['fomc_days'] <= 5)).astype(int)
    df['fomc_post'] = 0  # will compute directionally below
    df['near_earnings'] = (df['earnings_days'] <= 1).astype(int)

    # FOMC post: 1-3 days AFTER FOMC (need directional check)
    fomc_ts = set(pd.to_datetime(FOMC_DATES).normalize())
    for i in range(len(df)):
        d = dates[i]
        for fd in fomc_ts:
            diff = (d - fd).days
            if 1 <= diff <= 3:
                df.iloc[i, df.columns.get_loc('fomc_post')] = 1
                break

    # Day of week, month
    df['dow'] = df.index.dayofweek  # 0=Mon, 6=Sun
    df['month'] = df.index.month
    df['quarter'] = df.index.quarter

    return df


# ============================================================================
# BUILD MASTER DATAFRAME
# ============================================================================

def build_master(data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Merge all assets into a single daily DataFrame with all indicators."""
    print("Building master DataFrame...")

    btc = data['btc'].copy()
    btc = add_indicators(btc, prefix='btc_')
    btc = add_event_flags(btc)

    # Forward returns (close-to-close) for N days ahead
    for n in [1, 2, 3, 5, 7]:
        btc[f'fwd_{n}d'] = btc['Close'].shift(-n) / btc['Close'] - 1

    # Overnight return proxy (close to next open)
    btc['fwd_overnight'] = (btc['Open'].shift(-1) - btc['Close']) / btc['Close']

    # Forward max high / min low within next N days (relative to entry close)
    # These are the key columns for vectorized target/stop backtesting
    high_s = btc['High']
    low_s = btc['Low']
    close_s = btc['Close']
    for n in [1, 2, 3, 5]:
        # Rolling max of highs for the next N days (shift -1 to -N)
        fwd_highs = pd.concat([high_s.shift(-d) for d in range(1, n + 1)], axis=1)
        fwd_lows = pd.concat([low_s.shift(-d) for d in range(1, n + 1)], axis=1)
        btc[f'fwd_{n}d_high'] = fwd_highs.max(axis=1) / close_s - 1
        btc[f'fwd_{n}d_low'] = fwd_lows.min(axis=1) / close_s - 1

    # Cross-asset: merge SPX, Gold, DXY, VIX
    for name, prefix in [('spx', 'spx_'), ('gold', 'gold_'), ('dxy', 'dxy_')]:
        asset = data[name].copy()
        asset = add_indicators(asset, prefix=prefix)
        cols_to_merge = [c for c in asset.columns if c.startswith(prefix)]
        asset_merge = asset[cols_to_merge]
        btc = btc.join(asset_merge, how='left')

    # VIX (simpler - just close, change, level)
    vix = data['vix'][['Close']].copy()
    vix.columns = ['vix_close']
    vix['vix_change'] = vix['vix_close'].pct_change()
    vix['vix_sma20'] = vix['vix_close'].rolling(20).mean()
    btc = btc.join(vix, how='left')

    # BTC-SPX rolling correlation (30d)
    btc['corr_btc_spx_30d'] = btc['btc_ret_1d'].rolling(30).corr(btc['spx_ret_1d'])
    btc['corr_btc_gold_30d'] = btc['btc_ret_1d'].rolling(30).corr(btc['gold_ret_1d'])

    # Forward fill cross-asset NaNs (weekends, holidays)
    cross_cols = [c for c in btc.columns if c.startswith(('spx_', 'gold_', 'dxy_', 'vix_', 'corr_'))]
    btc[cross_cols] = btc[cross_cols].ffill()

    print(f"  Master: {len(btc)} rows x {len(btc.columns)} columns")
    print(f"  Date range: {btc.index[0].date()} to {btc.index[-1].date()}")

    return btc


# ============================================================================
# STRATEGY BACKTESTING ENGINE
# ============================================================================

def backtest_target_stop(
    df: pd.DataFrame,
    mask: pd.Series,
    target_pct: float,
    stop_pct: float,
    hold_days: int,
    label: str = '',
    min_trades: int = 15,
) -> Optional[Dict[str, Any]]:
    """
    Vectorized backtest with target/stop/hold logic.
    Uses pre-computed forward high/low columns for speed.
    """
    count = mask.sum()
    if count < min_trades:
        return None

    # Use pre-computed forward columns for fast vectorized evaluation
    hd_key = str(hold_days) if hold_days <= 5 else '5'
    fwd_high_col = f'fwd_{hd_key}d_high'
    fwd_low_col = f'fwd_{hd_key}d_low'
    fwd_close_col = f'fwd_{min(hold_days, 5)}d' if hold_days <= 5 else 'fwd_5d'

    entries = df.loc[mask].copy()
    entries = entries.dropna(subset=[fwd_high_col, fwd_low_col])

    if len(entries) < min_trades:
        return None

    max_high = entries[fwd_high_col].values
    max_low = entries[fwd_low_col].values
    close_prices = entries['Close'].values

    target_hit = max_high >= target_pct
    stop_hit = max_low <= stop_pct

    # Determine outcome per trade
    returns = np.where(
        stop_hit & ~target_hit, stop_pct,
        np.where(
            target_hit & ~stop_hit, target_pct,
            np.where(
                stop_hit & target_hit, stop_pct,  # conservative: stop first
                entries[fwd_close_col].values if fwd_close_col in entries.columns
                else entries['fwd_5d'].values
            )
        )
    )

    returns_pct = returns * 100
    valid = ~np.isnan(returns_pct)
    returns_pct = returns_pct[valid]

    if len(returns_pct) < min_trades:
        return None

    wins = returns_pct[returns_pct > 0]
    losses = returns_pct[returns_pct <= 0]
    win_rate = len(wins) / len(returns_pct) * 100
    avg_win = float(np.mean(wins)) if len(wins) > 0 else 0.0
    avg_loss = float(np.mean(losses)) if len(losses) > 0 else 0.0
    expectancy = (win_rate / 100 * avg_win) + ((100 - win_rate) / 100 * avg_loss)

    # Equity curve
    equity_arr = 10000.0 * np.cumprod(1 + returns_pct / 100)
    peak_arr = np.maximum.accumulate(equity_arr)
    dd_arr = (peak_arr - equity_arr) / peak_arr
    max_dd = float(dd_arr.max())
    cum_return = float((equity_arr[-1] / 10000 - 1) * 100)

    std = float(np.std(returns_pct))
    sharpe = float(np.mean(returns_pct)) / std * np.sqrt(252 / max(1, hold_days)) if std > 0 else 0.0

    # Trade log (last 30)
    entry_dates = entries.index[valid]
    trade_log = []
    for k in range(max(0, len(returns_pct) - 30), len(returns_pct)):
        idx = entry_dates[k]
        trade_log.append({
            'date': str(idx.date()) if hasattr(idx, 'date') else str(idx)[:10],
            'entry': round(float(close_prices[k] if k < len(close_prices) else 0), 2),
            'return_pct': round(float(returns_pct[k]), 4),
            'dow': int(idx.dayofweek) if hasattr(idx, 'dayofweek') else 0,
        })

    return {
        'label': label,
        'trades': int(len(returns_pct)),
        'win_rate': round(float(win_rate), 2),
        'avg_win': round(avg_win, 4),
        'avg_loss': round(avg_loss, 4),
        'expectancy': round(expectancy, 4),
        'cum_return': round(cum_return, 2),
        'max_drawdown': round(max_dd * 100, 2),
        'sharpe': round(float(sharpe), 3),
        'target_pct': target_pct,
        'stop_pct': stop_pct,
        'hold_days': hold_days,
        'trade_log': trade_log,
    }


# ============================================================================
# CONDITION FILTERS
# ============================================================================

def build_conditions(df: pd.DataFrame) -> Dict[str, pd.Series]:
    """Build a dictionary of named boolean condition masks."""
    c = df['Close']
    conds = {}

    # RSI thresholds
    for thresh in [20, 25, 30, 35, 40, 45, 50]:
        conds[f'rsi14_lt{thresh}'] = df['btc_rsi_14'] < thresh
        conds[f'rsi14_gt{100-thresh}'] = df['btc_rsi_14'] > (100 - thresh)
    conds['rsi7_lt30'] = df['btc_rsi_7'] < 30
    conds['rsi7_lt40'] = df['btc_rsi_7'] < 40

    # Trend
    conds['below_ema20'] = df['btc_above_ema20'] == 0
    conds['below_ema50'] = df['btc_above_ema50'] == 0
    conds['below_sma200'] = df['btc_above_sma200'] == 0
    conds['above_ema20'] = df['btc_above_ema20'] == 1
    conds['above_ema50'] = df['btc_above_ema50'] == 1
    conds['above_sma200'] = df['btc_above_sma200'] == 1
    conds['below_ema20_50'] = (df['btc_above_ema20'] == 0) & (df['btc_above_ema50'] == 0)
    conds['above_ema20_50'] = (df['btc_above_ema20'] == 1) & (df['btc_above_ema50'] == 1)

    # Bollinger
    conds['bb_below_lower'] = df['btc_bb_pct'] < 0
    conds['bb_below_20pct'] = df['btc_bb_pct'] < 0.2
    conds['bb_above_80pct'] = df['btc_bb_pct'] > 0.8
    conds['bb_above_upper'] = df['btc_bb_pct'] > 1.0

    # MACD
    conds['macd_bullish'] = df['btc_macd_hist'] > 0
    conds['macd_bearish'] = df['btc_macd_hist'] < 0
    conds['macd_cross_up'] = (df['btc_macd_hist'] > 0) & (df['btc_macd_hist'].shift(1) <= 0)

    # Volume
    conds['vol_below_avg'] = df['btc_vol_ratio'] < 1.0
    conds['vol_above_avg'] = df['btc_vol_ratio'] >= 1.0
    conds['vol_spike'] = df['btc_vol_ratio'] > 1.5
    conds['vol_low'] = df['btc_vol_ratio'] < 0.7

    # Dip conditions
    conds['btc_down_1pct'] = df['btc_ret_1d'] < -0.01
    conds['btc_down_2pct'] = df['btc_ret_1d'] < -0.02
    conds['btc_down_3pct'] = df['btc_ret_1d'] < -0.03
    conds['btc_down_5pct'] = df['btc_ret_1d'] < -0.05
    conds['btc_down_5d_5pct'] = df['btc_ret_5d'] < -0.05
    conds['btc_down_5d_10pct'] = df['btc_ret_5d'] < -0.10

    # Day of week
    for d in range(7):
        names = ['mon','tue','wed','thu','fri','sat','sun']
        conds[f'dow_{names[d]}'] = df['dow'] == d
    conds['dow_tue_thu'] = df['dow'].isin([1, 2, 3])
    conds['dow_weekday'] = df['dow'].isin([0, 1, 2, 3, 4])

    # Month groups
    conds['month_best'] = df['month'].isin([5, 6, 11, 12])
    conds['month_q4'] = df['month'].isin([10, 11, 12])
    conds['month_q1'] = df['month'].isin([1, 2, 3])

    # Cross-asset
    conds['spx_down_05'] = df['spx_ret_1d'] < -0.005
    conds['spx_down_1'] = df['spx_ret_1d'] < -0.01
    conds['spx_up'] = df['spx_ret_1d'] > 0
    conds['gold_down_05'] = df['gold_ret_1d'] < -0.005
    conds['gold_up'] = df['gold_ret_1d'] > 0
    conds['dxy_down'] = df['dxy_ret_1d'] < 0
    conds['dxy_flat'] = df['dxy_ret_1d'].abs() < 0.003

    # VIX
    conds['vix_lt15'] = df['vix_close'] < 15
    conds['vix_lt20'] = df['vix_close'] < 20
    conds['vix_gt20'] = df['vix_close'] > 20
    conds['vix_gt25'] = df['vix_close'] > 25
    conds['vix_gt30'] = df['vix_close'] > 30
    conds['vix_falling'] = df['vix_change'] < 0
    conds['vix_spike'] = df['vix_change'] > 0.05

    # Events
    conds['near_full_moon'] = df['near_full_moon'] == 1
    conds['near_new_moon'] = df['near_new_moon'] == 1
    conds['near_eclipse'] = df['near_eclipse'] == 1
    conds['no_eclipse'] = df['near_eclipse'] == 0
    conds['fomc_window'] = df['fomc_window'] == 1
    conds['fomc_pre'] = df['fomc_pre'] == 1
    conds['fomc_post'] = df['fomc_post'] == 1
    conds['no_fomc'] = (df['fomc_window'] == 0) & (df['fomc_pre'] == 0) & (df['fomc_post'] == 0)
    conds['near_earnings'] = df['near_earnings'] == 1
    conds['no_earnings'] = df['near_earnings'] == 0

    # Fill NaNs with False
    for k in conds:
        conds[k] = conds[k].fillna(False)

    return conds


# ============================================================================
# EXHAUSTIVE STRATEGY MINING
# ============================================================================

def mine_strategies(df: pd.DataFrame, conds: Dict[str, pd.Series]) -> List[Dict[str, Any]]:
    """
    Systematically test multi-condition combinations with target/stop grids.
    Returns list of strategy results sorted by win rate.
    """
    results = []

    # Target / Stop / Hold grids
    targets = [0.005, 0.01, 0.015, 0.02, 0.03]
    stops = [-0.005, -0.01, -0.015, -0.02, -0.03]
    holds = [1, 2, 3, 5]

    # ---- Phase A: Single-condition scan ----
    print("\n=== Phase A: Single-condition scan ===")
    single_winners = []
    for name, mask in conds.items():
        count = mask.sum()
        if count < 20:
            continue
        for tgt in targets:
            for stp in stops:
                for hd in holds:
                    r = backtest_target_stop(df, mask, tgt, stp, hd,
                                            label=f"{name} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                    if r and r['trades'] >= 20 and r['win_rate'] >= 55:
                        results.append(r)
                        if r['win_rate'] >= 65:
                            single_winners.append((name, tgt, stp, hd, r['win_rate'], r['trades']))

    print(f"  Phase A: {len(results)} strategies with WR >= 55% found")
    single_winners.sort(key=lambda x: -x[4])
    top_singles = single_winners[:30]
    print(f"  Top single conditions (WR >= 65%): {len(top_singles)}")
    for s in top_singles[:10]:
        print(f"    {s[0]}: WR={s[4]:.1f}%, trades={s[5]}, tgt={s[1]*100:.1f}%, stp={s[2]*100:.1f}%, hold={s[3]}d")

    # ---- Phase B: Two-condition combos ----
    print("\n=== Phase B: Two-condition combos ===")
    # Use top performing single conditions as building blocks
    top_cond_names = list(set([s[0] for s in single_winners[:50]]))
    # Also add high-value conditions
    must_test = ['rsi14_lt30', 'rsi14_lt40', 'rsi14_lt50', 'below_ema20_50', 'spx_down_1',
                 'vol_below_avg', 'vix_gt25', 'fomc_post', 'fomc_window',
                 'btc_down_3pct', 'btc_down_5pct', 'near_full_moon', 'near_new_moon',
                 'bb_below_lower', 'macd_cross_up', 'month_best', 'dow_tue_thu',
                 'dxy_down', 'gold_down_05', 'no_eclipse', 'above_sma200',
                 'btc_down_2pct', 'vix_spike', 'rsi7_lt30', 'vol_spike']
    combo_pool = list(set(top_cond_names + [m for m in must_test if m in conds]))
    print(f"  Combo pool: {len(combo_pool)} conditions")

    duo_count = 0
    for i, c1 in enumerate(combo_pool):
        for c2 in combo_pool[i+1:]:
            mask = conds[c1] & conds[c2]
            count = mask.sum()
            if count < 15:
                continue
            # Test best target/stop combos from Phase A
            for tgt, stp, hd in [(0.01, -0.015, 2), (0.015, -0.02, 3), (0.02, -0.02, 3),
                                  (0.01, -0.01, 1), (0.02, -0.03, 5), (0.03, -0.02, 5),
                                  (0.005, -0.01, 1), (0.015, -0.01, 2), (0.01, -0.02, 3)]:
                r = backtest_target_stop(df, mask, tgt, stp, hd,
                                        label=f"{c1} + {c2} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                if r and r['trades'] >= 15 and r['win_rate'] >= 60:
                    results.append(r)
                    duo_count += 1

    print(f"  Phase B: {duo_count} two-condition strategies with WR >= 60%")

    # ---- Phase C: Three-condition combos (selective) ----
    print("\n=== Phase C: Three-condition combos ===")
    # Pick the best duo ingredients
    high_wr_duos = [r for r in results if ' + ' in r['label'] and r['win_rate'] >= 70]
    trio_ingredients = set()
    for r in high_wr_duos:
        parts = r['label'].split(' | ')[0].split(' + ')
        for p in parts:
            trio_ingredients.add(p.strip())

    # Add core conditions
    trio_ingredients.update(['rsi14_lt40', 'rsi14_lt50', 'below_ema20_50', 'vix_gt25',
                             'fomc_post', 'btc_down_3pct', 'month_best', 'dow_tue_thu',
                             'spx_down_1', 'vol_below_avg', 'near_full_moon',
                             'above_sma200', 'dxy_down', 'no_eclipse'])
    trio_pool = [t for t in trio_ingredients if t in conds]
    print(f"  Trio pool: {len(trio_pool)} conditions")

    trio_count = 0
    for i, c1 in enumerate(trio_pool):
        for j, c2 in enumerate(trio_pool[i+1:], i+1):
            for c3 in trio_pool[j+1:]:
                mask = conds[c1] & conds[c2] & conds[c3]
                count = mask.sum()
                if count < 10:
                    continue
                for tgt, stp, hd in [(0.01, -0.015, 2), (0.015, -0.02, 3), (0.02, -0.02, 3),
                                      (0.01, -0.01, 1), (0.02, -0.03, 5), (0.005, -0.01, 1)]:
                    r = backtest_target_stop(df, mask, tgt, stp, hd,
                                            label=f"{c1} + {c2} + {c3} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                    if r and r['trades'] >= 10 and r['win_rate'] >= 65:
                        results.append(r)
                        trio_count += 1

    print(f"  Phase C: {trio_count} three-condition strategies with WR >= 65%")

    # ---- Phase D: Four+ condition combos (ultra-selective) ----
    print("\n=== Phase D: Four-condition ultra-selective combos ===")
    # Build from the best trios
    high_wr_trios = sorted([r for r in results if r['label'].count('+') >= 2 and r['win_rate'] >= 75],
                           key=lambda x: -x['win_rate'])[:30]
    quad_ingredients = set()
    for r in high_wr_trios:
        parts = r['label'].split(' | ')[0].split(' + ')
        for p in parts:
            quad_ingredients.add(p.strip())

    quad_extra = ['above_sma200', 'no_eclipse', 'no_earnings', 'vix_falling',
                  'dxy_flat', 'month_best', 'vol_below_avg', 'dow_tue_thu', 'near_new_moon']
    quad_pool = list(quad_ingredients.union(set([q for q in quad_extra if q in conds])))

    quad_count = 0
    for i, c1 in enumerate(quad_pool):
        for j, c2 in enumerate(quad_pool[i+1:], i+1):
            for k, c3 in enumerate(quad_pool[j+1:], j+1):
                for c4 in quad_pool[k+1:]:
                    mask = conds[c1] & conds[c2] & conds[c3] & conds[c4]
                    count = mask.sum()
                    if count < 8:
                        continue
                    for tgt, stp, hd in [(0.01, -0.015, 2), (0.015, -0.02, 3), (0.02, -0.03, 5),
                                          (0.005, -0.01, 1)]:
                        r = backtest_target_stop(df, mask, tgt, stp, hd,
                                                label=f"{c1} + {c2} + {c3} + {c4} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                        if r and r['trades'] >= 8 and r['win_rate'] >= 70:
                            results.append(r)
                            quad_count += 1

    print(f"  Phase D: {quad_count} four-condition strategies with WR >= 70%")

    return results


# ============================================================================
# SPECIAL STRATEGY: MEAN REVERSION WITH TARGET HIT ANALYSIS
# ============================================================================

def mean_reversion_analysis(df: pd.DataFrame, conds: Dict[str, pd.Series]) -> List[Dict[str, Any]]:
    """
    Specific analysis: when BTC dips + conditions align, what % of the time
    does price recover by X% within N days?
    """
    print("\n=== Special: Mean Reversion Target-Hit Analysis ===")
    results = []

    # Key dip + recovery scenarios
    scenarios = [
        ('rsi14_lt30', 'RSI<30'),
        ('rsi14_lt35', 'RSI<35'),
        ('btc_down_3pct', 'BTC -3% day'),
        ('btc_down_5pct', 'BTC -5% day'),
        ('bb_below_lower', 'Below BB Lower'),
        ('btc_down_5d_10pct', 'BTC -10% in 5d'),
    ]

    enhancers = [
        ('vol_spike', 'Volume Spike'),
        ('vix_gt25', 'VIX>25'),
        ('spx_down_1', 'SPX down >1%'),
        ('near_full_moon', 'Near Full Moon'),
        ('fomc_post', 'Post FOMC'),
        ('above_sma200', 'Above SMA200'),
        ('month_best', 'Best Month'),
    ]

    for s_key, s_name in scenarios:
        if s_key not in conds:
            continue
        base_mask = conds[s_key]
        if base_mask.sum() < 10:
            continue

        # Pure scenario
        for tgt in [0.005, 0.01, 0.015, 0.02, 0.03, 0.05]:
            for stp in [-0.01, -0.02, -0.03, -0.05]:
                for hd in [1, 2, 3, 5, 7]:
                    r = backtest_target_stop(df, base_mask, tgt, stp, hd,
                                            label=f"MR: {s_name} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                    if r and r['win_rate'] >= 60:
                        results.append(r)

        # Scenario + enhancer
        for e_key, e_name in enhancers:
            if e_key not in conds:
                continue
            combo_mask = base_mask & conds[e_key]
            if combo_mask.sum() < 5:
                continue
            for tgt in [0.01, 0.02, 0.03, 0.05]:
                for stp in [-0.02, -0.03, -0.05]:
                    for hd in [2, 3, 5, 7]:
                        r = backtest_target_stop(df, combo_mask, tgt, stp, hd,
                                                label=f"MR: {s_name} + {e_name} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                        if r and r['win_rate'] >= 60:
                            results.append(r)

    print(f"  Mean Reversion: {len(results)} strategies found")
    return results


# ============================================================================
# CROSS-ASSET LEAD STRATEGY
# ============================================================================

def cross_asset_analysis(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """SPX/Gold/VIX moves predict BTC next-day direction."""
    print("\n=== Special: Cross-Asset Lead Strategies ===")
    results = []

    scenarios = [
        ('spx_big_up', df['spx_ret_1d'] > 0.01, 'SPX up >1%'),
        ('spx_big_down', df['spx_ret_1d'] < -0.01, 'SPX down >1%'),
        ('gold_big_up', df['gold_ret_1d'] > 0.01, 'Gold up >1%'),
        ('vix_crush', df['vix_change'] < -0.05, 'VIX crush >5%'),
        ('vix_spike_big', df['vix_change'] > 0.1, 'VIX spike >10%'),
        ('dxy_drop', df['dxy_ret_1d'] < -0.005, 'DXY drop >0.5%'),
        ('risk_off', (df['spx_ret_1d'] < -0.01) & (df['vix_change'] > 0.05), 'Risk-off (SPX down + VIX up)'),
        ('risk_on', (df['spx_ret_1d'] > 0.01) & (df['vix_change'] < -0.03), 'Risk-on (SPX up + VIX down)'),
    ]

    for key, mask, name in scenarios:
        mask = mask.fillna(False)
        if mask.sum() < 15:
            continue
        for tgt in [0.01, 0.015, 0.02, 0.03]:
            for stp in [-0.01, -0.015, -0.02, -0.03]:
                for hd in [1, 2, 3, 5]:
                    r = backtest_target_stop(df, mask, tgt, stp, hd,
                                            label=f"XA: {name} | tgt={tgt*100:.1f}% stp={stp*100:.1f}% hold={hd}d")
                    if r and r['win_rate'] >= 55:
                        results.append(r)

    print(f"  Cross-Asset: {len(results)} strategies found")
    return results


# ============================================================================
# MAIN
# ============================================================================

def main():
    start_time = datetime.now()
    print("=" * 80)
    print("BTC STRATEGY DEEP RESEARCH ENGINE")
    print(f"Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # Fetch data
    data = fetch_all_data()

    # Build master dataframe
    df = build_master(data)

    # Focus on period with good cross-asset data (2017+)
    df = df.loc['2017-01-01':]
    df = df.dropna(subset=['fwd_1d', 'Close', 'btc_rsi_14'])
    print(f"\nAnalysis period: {df.index[0].date()} to {df.index[-1].date()} ({len(df)} trading days)")

    # Build conditions
    conds = build_conditions(df)
    print(f"Built {len(conds)} condition filters")

    # ---- RUN ALL STRATEGY MINING ----
    all_results = []

    # Exhaustive multi-condition mining
    r1 = mine_strategies(df, conds)
    all_results.extend(r1)

    # Mean reversion
    r2 = mean_reversion_analysis(df, conds)
    all_results.extend(r2)

    # Cross-asset
    r3 = cross_asset_analysis(df)
    all_results.extend(r3)

    print(f"\n{'='*80}")
    print(f"TOTAL STRATEGIES TESTED: {len(all_results)}")
    print(f"{'='*80}")

    # ---- RANK AND OUTPUT ----

    # Deduplicate by label (keep highest win rate)
    seen = {}
    for r in all_results:
        key = r['label']
        if key not in seen or r['win_rate'] > seen[key]['win_rate']:
            seen[key] = r
    all_results = list(seen.values())

    # Sort by win rate
    by_wr = sorted(all_results, key=lambda x: (-x['win_rate'], -x['trades']))

    # Top 20 by win rate (min 15 trades)
    top_wr = [r for r in by_wr if r['trades'] >= 15][:30]

    # Top by expectancy (min 15 trades)
    by_exp = sorted([r for r in all_results if r['trades'] >= 15],
                    key=lambda x: (-x['expectancy'], -x['win_rate']))[:20]

    # Holy grail: 80%+ WR AND positive expectancy AND 15+ trades
    holy_grail = sorted([r for r in all_results
                         if r['win_rate'] >= 80 and r['expectancy'] > 0 and r['trades'] >= 10],
                        key=lambda x: (-x['win_rate'], -x['expectancy']))[:20]

    # Best overall (composite score)
    for r in all_results:
        r['composite'] = (r['win_rate'] * 0.4 +
                          min(r['trades'], 100) * 0.2 +
                          max(0, r['expectancy']) * 20 * 0.2 +
                          r['sharpe'] * 10 * 0.2)
    by_composite = sorted(all_results, key=lambda x: -x.get('composite', 0))[:20]

    # Print results
    print("\n" + "=" * 80)
    print("TOP 20 STRATEGIES BY WIN RATE (min 15 trades)")
    print("=" * 80)
    for i, r in enumerate(top_wr[:20], 1):
        print(f"\n#{i}: WR={r['win_rate']:.1f}% | Trades={r['trades']} | Exp={r['expectancy']:.3f}% "
              f"| Sharpe={r['sharpe']:.2f} | MaxDD={r['max_drawdown']:.1f}% | Cum={r['cum_return']:.1f}%")
        print(f"    {r['label']}")

    print("\n" + "=" * 80)
    print("HOLY GRAIL: 80%+ WIN RATE + POSITIVE EXPECTANCY")
    print("=" * 80)
    for i, r in enumerate(holy_grail[:20], 1):
        print(f"\n#{i}: WR={r['win_rate']:.1f}% | Trades={r['trades']} | Exp={r['expectancy']:.3f}% "
              f"| Sharpe={r['sharpe']:.2f} | MaxDD={r['max_drawdown']:.1f}% | Cum={r['cum_return']:.1f}%")
        print(f"    {r['label']}")

    print("\n" + "=" * 80)
    print("TOP 20 BY EXPECTANCY (profit per trade)")
    print("=" * 80)
    for i, r in enumerate(by_exp[:20], 1):
        print(f"\n#{i}: Exp={r['expectancy']:.3f}% | WR={r['win_rate']:.1f}% | Trades={r['trades']} "
              f"| Sharpe={r['sharpe']:.2f} | Cum={r['cum_return']:.1f}%")
        print(f"    {r['label']}")

    print("\n" + "=" * 80)
    print("TOP 20 COMPOSITE SCORE (balanced)")
    print("=" * 80)
    for i, r in enumerate(by_composite[:20], 1):
        print(f"\n#{i}: Score={r.get('composite',0):.1f} | WR={r['win_rate']:.1f}% | Trades={r['trades']} "
              f"| Exp={r['expectancy']:.3f}% | Sharpe={r['sharpe']:.2f}")
        print(f"    {r['label']}")

    # Save to JSON
    output = {
        'generated': datetime.now().isoformat(),
        'analysis_period': f"{df.index[0].date()} to {df.index[-1].date()}",
        'total_trading_days': len(df),
        'total_strategies_tested': len(all_results),
        'top_by_win_rate': top_wr[:30],
        'holy_grail': holy_grail[:20],
        'top_by_expectancy': by_exp[:20],
        'top_by_composite': by_composite[:20],
    }

    # Remove trade_log from non-top strategies to save space, keep for top 10
    for section in ['top_by_win_rate', 'holy_grail', 'top_by_expectancy', 'top_by_composite']:
        for i, r in enumerate(output[section]):
            if i >= 10:
                r.pop('trade_log', None)

    out_path = os.path.join(os.path.dirname(__file__), 'research_results.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n{'='*80}")
    print(f"DONE in {elapsed:.0f}s. Results saved to {out_path}")
    print(f"{'='*80}")


if __name__ == '__main__':
    main()
