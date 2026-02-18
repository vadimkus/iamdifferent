#!/usr/bin/env python3
"""
Friday BTC Optimal Entry Time Analysis
========================================
Analyzes 10 years of daily + 2 years of hourly BTC data to find the
best hour on Friday (during US session) to buy BTC for the weekend scalp.

Outputs: btc/friday_timing_results.json
"""

import json, os, warnings
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import yfinance as yf
import functools

warnings.filterwarnings('ignore')
print = functools.partial(print, flush=True)

# ============================================================================
# 1. FETCH DATA
# ============================================================================

def fetch_data():
    print("=" * 70)
    print("FRIDAY BTC OPTIMAL ENTRY TIME ANALYSIS")
    print("=" * 70)

    # --- 10 years daily ---
    print("\n[1/3] Fetching 10 years daily BTC data...")
    btc_daily = yf.download('BTC-USD', period='10y', interval='1d', progress=False)
    if isinstance(btc_daily.columns, pd.MultiIndex):
        btc_daily.columns = [c[0] for c in btc_daily.columns]
    btc_daily.index = pd.to_datetime(btc_daily.index)
    print(f"  Got {len(btc_daily)} daily bars: {btc_daily.index[0].date()} → {btc_daily.index[-1].date()}")

    # --- 2 years hourly ---
    print("[2/3] Fetching 2 years hourly BTC data...")
    btc_1h = yf.download('BTC-USD', period='2y', interval='1h', progress=False)
    if isinstance(btc_1h.columns, pd.MultiIndex):
        btc_1h.columns = [c[0] for c in btc_1h.columns]
    btc_1h.index = pd.to_datetime(btc_1h.index)
    if btc_1h.index.tz is not None:
        btc_1h.index = btc_1h.index.tz_convert('UTC').tz_localize(None)
    print(f"  Got {len(btc_1h)} hourly bars: {btc_1h.index[0]} → {btc_1h.index[-1]}")

    # --- 2 years hourly SPX for context ---
    print("[3/3] Fetching SPX hourly for cross-reference...")
    spx_1h = yf.download('^GSPC', period='2y', interval='1h', progress=False)
    if isinstance(spx_1h.columns, pd.MultiIndex):
        spx_1h.columns = [c[0] for c in spx_1h.columns]
    spx_1h.index = pd.to_datetime(spx_1h.index)
    if spx_1h.index.tz is not None:
        spx_1h.index = spx_1h.index.tz_convert('UTC').tz_localize(None)
    print(f"  Got {len(spx_1h)} SPX hourly bars")

    return btc_daily, btc_1h, spx_1h


# ============================================================================
# 2. DAILY (10-YEAR) FRIDAY ANALYSIS
# ============================================================================

def analyze_daily_fridays(df):
    """Analyze Friday close → Monday/Saturday performance over 10 years."""
    print("\n" + "=" * 70)
    print("10-YEAR DAILY FRIDAY ANALYSIS")
    print("=" * 70)

    df = df.copy()
    df['dow'] = df.index.dayofweek  # 0=Mon ... 4=Fri
    df['month'] = df.index.month
    df['year'] = df.index.year
    df['ret_next'] = df['Close'].shift(-1) / df['Close'] - 1  # next day return
    df['ret_next2'] = df['Close'].shift(-2) / df['Close'] - 1  # 2-day return (weekend)

    fridays = df[df['dow'] == 4].copy()
    print(f"\nTotal Fridays: {len(fridays)}")

    # Overall Friday stats
    wins_1d = (fridays['ret_next'] > 0).sum()
    wins_2d = (fridays['ret_next2'] > 0).sum()
    print(f"\n  Friday→Sat win rate:  {wins_1d/len(fridays)*100:.1f}% ({wins_1d}/{len(fridays)})")
    print(f"  Friday→Mon win rate:  {wins_2d/len(fridays)*100:.1f}% ({wins_2d}/{len(fridays)})")
    print(f"  Avg 1-day return:     {fridays['ret_next'].mean()*100:.4f}%")
    print(f"  Avg 2-day return:     {fridays['ret_next2'].mean()*100:.4f}%")

    # By Month
    print("\n--- By Month (Friday→next day) ---")
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    monthly = []
    for m in range(1, 13):
        mf = fridays[fridays['month'] == m]
        if len(mf) == 0:
            continue
        avg = mf['ret_next'].mean() * 100
        wr = (mf['ret_next'] > 0).sum() / len(mf) * 100
        avg2 = mf['ret_next2'].mean() * 100
        wr2 = (mf['ret_next2'] > 0).sum() / len(mf) * 100
        monthly.append({
            'month': month_names[m-1],
            'month_num': m,
            'fridays': len(mf),
            'avg_return_1d': round(avg, 4),
            'win_rate_1d': round(wr, 1),
            'avg_return_2d': round(avg2, 4),
            'win_rate_2d': round(wr2, 1),
        })
        print(f"  {month_names[m-1]:>3}: {len(mf):3d} Fri | 1d WR={wr:5.1f}% avg={avg:+.4f}% | 2d WR={wr2:5.1f}% avg={avg2:+.4f}%")

    # By Year
    print("\n--- By Year ---")
    yearly = []
    for y in sorted(fridays['year'].unique()):
        yf_ = fridays[fridays['year'] == y]
        avg = yf_['ret_next'].mean() * 100
        wr = (yf_['ret_next'] > 0).sum() / len(yf_) * 100
        yearly.append({
            'year': int(y),
            'fridays': len(yf_),
            'avg_return': round(avg, 4),
            'win_rate': round(wr, 1),
        })
        print(f"  {y}: {len(yf_):3d} Fri | WR={wr:5.1f}% avg={avg:+.4f}%")

    return monthly, yearly, fridays


# ============================================================================
# 3. HOURLY (2-YEAR) FRIDAY ANALYSIS - THE KEY PART
# ============================================================================

def analyze_hourly_fridays(btc_1h, spx_1h):
    """Find optimal Friday entry hour during US session."""
    print("\n" + "=" * 70)
    print("2-YEAR HOURLY FRIDAY ANALYSIS — OPTIMAL ENTRY TIME")
    print("=" * 70)

    df = btc_1h.copy()
    df['hour_utc'] = df.index.hour
    df['dow'] = df.index.dayofweek
    df['date'] = df.index.date
    df['hour_dubai'] = (df['hour_utc'] + 4) % 24

    # Filter to Fridays only
    fri = df[df['dow'] == 4].copy()
    print(f"\nFriday hourly bars: {len(fri)}")

    # For each Friday, find Saturday 6AM UTC (= 10AM Dubai) price as exit
    friday_dates = sorted(fri['date'].unique())
    print(f"Unique Fridays: {len(friday_dates)}")

    # Build exit prices: for each Friday, get the BTC price at various exit points
    results_by_hour = {}

    # US session hours in UTC: 14-21 (9AM-4PM ET)
    # Extended to cover full evening: 12-23 UTC (4PM-3AM Dubai)
    analysis_hours = list(range(12, 24))

    for entry_hour in analysis_hours:
        trades = []
        for fdate in friday_dates:
            # Get entry candle
            entry_mask = (fri['date'] == fdate) & (fri['hour_utc'] == entry_hour)
            entry_candles = fri[entry_mask]
            if len(entry_candles) == 0:
                continue
            entry_price = entry_candles.iloc[0]['Close']

            # Exit targets: +6h, +8h, +10h, +12h, Saturday 6AM UTC, Monday open
            sat_date = fdate + timedelta(days=1)
            mon_date = fdate + timedelta(days=3)

            # Get prices from the full dataset
            exit_6h = df[(df.index >= pd.Timestamp(fdate) + timedelta(hours=entry_hour + 6)) &
                         (df.index <= pd.Timestamp(fdate) + timedelta(hours=entry_hour + 7))]
            exit_sat_6am = df[(df['date'] == sat_date) & (df['hour_utc'] == 6)]
            exit_sat_8am = df[(df['date'] == sat_date) & (df['hour_utc'] == 8)]
            exit_mon = df[(df['date'] == mon_date) & (df['hour_utc'] >= 14) & (df['hour_utc'] <= 15)]

            # Saturday 6AM Dubai = Saturday 2AM UTC
            exit_sat_2am = df[(df['date'] == sat_date) & (df['hour_utc'] == 2)]
            # Saturday 8AM Dubai = Saturday 4AM UTC
            exit_sat_4am = df[(df['date'] == sat_date) & (df['hour_utc'] == 4)]

            trade = {
                'date': str(fdate),
                'entry_hour_utc': entry_hour,
                'entry_price': float(entry_price),
            }

            # Compute returns for various exit points
            for label, exit_df in [
                ('6h_later', exit_6h),
                ('sat_2am_utc', exit_sat_2am),
                ('sat_4am_utc', exit_sat_4am),
                ('sat_6am_utc', exit_sat_6am),
                ('sat_8am_utc', exit_sat_8am),
            ]:
                if len(exit_df) > 0:
                    exit_price = exit_df.iloc[0]['Close']
                    ret = (exit_price / entry_price - 1) * 100
                    trade[f'ret_{label}'] = float(round(ret, 4))
                else:
                    trade[f'ret_{label}'] = None

            # TP/SL check: scan forward from entry to see if +0.5% TP or -1% SL hit first
            forward = df[(df.index > entry_candles.index[0]) &
                         (df.index <= pd.Timestamp(fdate) + timedelta(hours=entry_hour + 24))]
            tp_hit = False
            sl_hit = False
            tp_price = entry_price * 1.005
            sl_price = entry_price * 0.99
            for _, row in forward.iterrows():
                if row['High'] >= tp_price and not tp_hit and not sl_hit:
                    tp_hit = True
                    break
                if row['Low'] <= sl_price and not tp_hit and not sl_hit:
                    sl_hit = True
                    break
            trade['tp_hit'] = tp_hit
            trade['sl_hit'] = sl_hit
            trade['neither'] = not tp_hit and not sl_hit

            trades.append(trade)

        if len(trades) == 0:
            continue

        tdf = pd.DataFrame(trades)
        n = len(tdf)

        hour_dubai = (entry_hour + 4) % 24
        hour_et = entry_hour - 5 if entry_hour >= 5 else entry_hour + 19

        stat = {
            'entry_hour_utc': entry_hour,
            'entry_hour_dubai': hour_dubai,
            'entry_hour_et': hour_et,
            'trades': n,
        }

        # Stats for each exit
        for exit_label in ['6h_later', 'sat_2am_utc', 'sat_4am_utc', 'sat_6am_utc', 'sat_8am_utc']:
            col = f'ret_{exit_label}'
            valid = tdf[tdf[col].notna()][col]
            if len(valid) > 0:
                stat[f'{exit_label}_avg'] = round(valid.mean(), 4)
                stat[f'{exit_label}_wr'] = round((valid > 0).sum() / len(valid) * 100, 1)
                stat[f'{exit_label}_median'] = round(valid.median(), 4)
            else:
                stat[f'{exit_label}_avg'] = None
                stat[f'{exit_label}_wr'] = None
                stat[f'{exit_label}_median'] = None

        # TP/SL stats
        tp_count = tdf['tp_hit'].sum()
        sl_count = tdf['sl_hit'].sum()
        stat['tp_hit_rate'] = round(tp_count / n * 100, 1)
        stat['sl_hit_rate'] = round(sl_count / n * 100, 1)
        stat['neither_rate'] = round((n - tp_count - sl_count) / n * 100, 1)

        results_by_hour[entry_hour] = stat

        print(f"\n  {hour_dubai:02d}:00 Dubai / {entry_hour:02d}:00 UTC / {hour_et:02d}:00 ET")
        print(f"    Trades: {n}")
        if stat['sat_4am_utc_wr'] is not None:
            print(f"    → Sat 8AM Dubai:  WR={stat['sat_4am_utc_wr']}%  avg={stat['sat_4am_utc_avg']:+.4f}%")
        if stat['sat_6am_utc_wr'] is not None:
            print(f"    → Sat 10AM Dubai: WR={stat['sat_6am_utc_wr']}%  avg={stat['sat_6am_utc_avg']:+.4f}%")
        print(f"    TP(+0.5%) hit: {stat['tp_hit_rate']}%  SL(-1%) hit: {stat['sl_hit_rate']}%  Neither: {stat['neither_rate']}%")

    return results_by_hour


# ============================================================================
# 4. MONTHLY × HOURLY CROSS TABLE
# ============================================================================

def analyze_monthly_hourly(btc_1h):
    """Build month × hour matrix for Friday entries."""
    print("\n" + "=" * 70)
    print("MONTH × HOUR CROSS TABLE (Friday entries → Sat 8AM Dubai exit)")
    print("=" * 70)

    df = btc_1h.copy()
    df['hour_utc'] = df.index.hour
    df['dow'] = df.index.dayofweek
    df['date'] = df.index.date
    df['month'] = df.index.month

    fri = df[df['dow'] == 4].copy()
    friday_dates = sorted(fri['date'].unique())

    us_session_hours = list(range(14, 22))  # 2PM-9PM UTC = 6PM-1AM Dubai
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    cross_table = []

    for m in range(1, 13):
        for entry_hour in us_session_hours:
            trades = []
            for fdate in friday_dates:
                fdt = pd.Timestamp(fdate)
                if fdt.month != m:
                    continue

                entry_mask = (fri['date'] == fdate) & (fri['hour_utc'] == entry_hour)
                entry_candles = fri[entry_mask]
                if len(entry_candles) == 0:
                    continue
                entry_price = entry_candles.iloc[0]['Close']

                # Exit: Saturday 4AM UTC = 8AM Dubai
                sat_date = fdate + timedelta(days=1)
                exit_df = df[(df['date'] == sat_date) & (df['hour_utc'] == 4)]
                if len(exit_df) == 0:
                    continue

                ret = (exit_df.iloc[0]['Close'] / entry_price - 1) * 100
                trades.append(ret)

            if len(trades) < 2:
                continue

            arr = np.array(trades)
            cross_table.append({
                'month': month_names[m-1],
                'month_num': m,
                'entry_hour_utc': entry_hour,
                'entry_hour_dubai': (entry_hour + 4) % 24,
                'trades': len(trades),
                'win_rate': round((arr > 0).sum() / len(arr) * 100, 1),
                'avg_return': round(arr.mean(), 4),
                'median_return': round(float(np.median(arr)), 4),
            })

    # Print the cross table
    print(f"\n{'Month':>5}", end='')
    for h in us_session_hours:
        dh = (h + 4) % 24
        print(f"  {dh:02d}:00D", end='')
    print()
    print("-" * (6 + 8 * len(us_session_hours)))

    for m in range(1, 13):
        print(f"{month_names[m-1]:>5}", end='')
        for h in us_session_hours:
            cell = [c for c in cross_table if c['month_num'] == m and c['entry_hour_utc'] == h]
            if cell:
                wr = cell[0]['win_rate']
                print(f"  {wr:5.1f}%", end='')
            else:
                print(f"     -- ", end='')
        print()

    # Find best cells
    if cross_table:
        best = sorted(cross_table, key=lambda x: (-x['win_rate'], -x['avg_return']))
        print(f"\n--- TOP 10 MONTH × HOUR COMBINATIONS ---")
        for i, b in enumerate(best[:10]):
            print(f"  #{i+1}: {b['month']:>3} {b['entry_hour_dubai']:02d}:00 Dubai ({b['entry_hour_utc']:02d}:00 UTC) | "
                  f"WR={b['win_rate']}% avg={b['avg_return']:+.4f}% | {b['trades']} trades")

    return cross_table


# ============================================================================
# 5. VOLUME-WEIGHTED ANALYSIS
# ============================================================================

def analyze_volume_effect(btc_1h):
    """Check if low-volume Fridays perform differently."""
    print("\n" + "=" * 70)
    print("VOLUME EFFECT ON FRIDAY ENTRIES")
    print("=" * 70)

    df = btc_1h.copy()
    df['hour_utc'] = df.index.hour
    df['dow'] = df.index.dayofweek
    df['date'] = df.index.date

    fri = df[df['dow'] == 4].copy()

    # Compute daily volume per Friday
    daily_vol = fri.groupby('date')['Volume'].sum()
    vol_median = daily_vol.median()

    low_vol_dates = set(daily_vol[daily_vol < vol_median].index)
    high_vol_dates = set(daily_vol[daily_vol >= vol_median].index)

    friday_dates = sorted(fri['date'].unique())
    best_hours = [16, 17, 18, 19, 20]  # US afternoon in UTC

    volume_results = []

    for vol_label, vol_dates in [('low_volume', low_vol_dates), ('high_volume', high_vol_dates)]:
        for entry_hour in best_hours:
            trades = []
            for fdate in friday_dates:
                if fdate not in vol_dates:
                    continue
                entry_mask = (fri['date'] == fdate) & (fri['hour_utc'] == entry_hour)
                ec = fri[entry_mask]
                if len(ec) == 0:
                    continue
                entry_price = ec.iloc[0]['Close']

                sat_date = fdate + timedelta(days=1)
                exit_df = df[(df['date'] == sat_date) & (df['hour_utc'] == 4)]
                if len(exit_df) == 0:
                    continue
                ret = (exit_df.iloc[0]['Close'] / entry_price - 1) * 100
                trades.append(ret)

            if len(trades) < 3:
                continue

            arr = np.array(trades)
            res = {
                'volume': vol_label,
                'entry_hour_utc': entry_hour,
                'entry_hour_dubai': (entry_hour + 4) % 24,
                'trades': len(trades),
                'win_rate': round((arr > 0).sum() / len(arr) * 100, 1),
                'avg_return': round(arr.mean(), 4),
            }
            volume_results.append(res)
            print(f"  {vol_label:>12} | {(entry_hour+4)%24:02d}:00 Dubai | WR={res['win_rate']}% avg={res['avg_return']:+.4f}% | {len(trades)} trades")

    return volume_results


# ============================================================================
# 6. OPTIMAL ENTRY RECOMMENDATION
# ============================================================================

def compute_recommendation(hourly_stats, cross_table, volume_results):
    """Synthesize all data into a single recommendation."""
    print("\n" + "=" * 70)
    print("FINAL RECOMMENDATION — OPTIMAL FRIDAY ENTRY TIME")
    print("=" * 70)

    # Score each hour: weight TP hit rate, win rate at different exits, volume edge
    scored = []
    for h, stat in hourly_stats.items():
        score = 0
        notes = []

        # TP hit rate is king
        tp = stat.get('tp_hit_rate', 0) or 0
        score += tp * 3
        if tp >= 60:
            notes.append(f"TP hit {tp}%")

        # Sat 8AM Dubai exit win rate
        wr_8am = stat.get('sat_4am_utc_wr', 0) or 0
        score += wr_8am * 2
        if wr_8am >= 55:
            notes.append(f"8AM exit WR {wr_8am}%")

        # Sat 10AM Dubai exit
        wr_10am = stat.get('sat_6am_utc_wr', 0) or 0
        score += wr_10am * 1.5

        # Average return
        avg = stat.get('sat_4am_utc_avg', 0) or 0
        if avg > 0:
            score += avg * 100

        # Low SL hit is good
        sl = stat.get('sl_hit_rate', 100) or 100
        if sl < 15:
            score += 30
            notes.append(f"Low SL risk {sl}%")

        scored.append({
            'entry_hour_utc': h,
            'entry_hour_dubai': (h + 4) % 24,
            'entry_hour_et': h - 5 if h >= 5 else h + 19,
            'score': round(score, 1),
            'tp_hit_rate': tp,
            'wr_sat_8am_dubai': wr_8am,
            'avg_ret_sat_8am': avg,
            'sl_hit_rate': sl,
            'notes': notes,
            **stat,
        })

    scored.sort(key=lambda x: -x['score'])

    print("\n--- RANKED BY COMPOSITE SCORE ---")
    for i, s in enumerate(scored):
        dh = s['entry_hour_dubai']
        marker = " ← BEST" if i == 0 else " ← 2nd" if i == 1 else " ← 3rd" if i == 2 else ""
        print(f"  #{i+1} {dh:02d}:00 Dubai ({s['entry_hour_utc']:02d} UTC / {s['entry_hour_et']:02d} ET) "
              f"| Score: {s['score']:6.1f} | TP: {s['tp_hit_rate']}% | WR: {s['wr_sat_8am_dubai']}% "
              f"| Avg: {s['avg_ret_sat_8am']:+.4f}% | SL: {s['sl_hit_rate']}%{marker}")

    best = scored[0]
    print(f"\n{'='*70}")
    print(f"  RECOMMENDATION: BUY BTC at {best['entry_hour_dubai']:02d}:00 Dubai Time on Fridays")
    print(f"  ({best['entry_hour_utc']:02d}:00 UTC / {best['entry_hour_et']:02d}:00 ET)")
    print(f"  TP: +0.5%  SL: -1%  or exit Sat 8AM Dubai")
    print(f"  Historical TP hit rate: {best['tp_hit_rate']}%")
    print(f"  Historical win rate (Sat 8AM exit): {best['wr_sat_8am_dubai']}%")
    print(f"{'='*70}")

    return scored


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    btc_daily, btc_1h, spx_1h = fetch_data()

    # 10-year daily Friday analysis
    monthly, yearly, _ = analyze_daily_fridays(btc_daily)

    # 2-year hourly Friday analysis (optimal entry hour)
    hourly_stats = analyze_hourly_fridays(btc_1h, spx_1h)

    # Month × Hour cross table
    cross_table = analyze_monthly_hourly(btc_1h)

    # Volume effect
    volume_results = analyze_volume_effect(btc_1h)

    # Final recommendation
    ranked_hours = compute_recommendation(hourly_stats, cross_table, volume_results)

    # Save results
    output = {
        'generated': datetime.utcnow().isoformat(),
        'data_range_daily': '10 years',
        'data_range_hourly': '2 years',
        'monthly_friday_stats': monthly,
        'yearly_friday_stats': yearly,
        'hourly_entry_analysis': list(hourly_stats.values()),
        'month_hour_cross_table': cross_table,
        'volume_effect': volume_results,
        'ranked_entry_hours': ranked_hours,
        'best_entry': {
            'hour_dubai': ranked_hours[0]['entry_hour_dubai'],
            'hour_utc': ranked_hours[0]['entry_hour_utc'],
            'hour_et': ranked_hours[0]['entry_hour_et'],
            'tp_hit_rate': ranked_hours[0]['tp_hit_rate'],
            'win_rate_sat_8am': ranked_hours[0]['wr_sat_8am_dubai'],
            'avg_return': ranked_hours[0]['avg_ret_sat_8am'],
        },
    }

    out_path = os.path.join(os.path.dirname(__file__), 'friday_timing_results.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\nResults saved to {out_path}")
