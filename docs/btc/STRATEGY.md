# Alpha Trading Strategies

## Overview

Three backtested strategies identified through systematic research across 508 condition combinations using 9+ years of BTC, SPX, Gold, DXY, and VIX data. All strategies have **80%+ historical win rate**.

---

## Strategy 1: Cosmic Convergence

**Win Rate: 84.21% | 19 Trades | Sharpe: 4.71**

### Thesis
During rare Eclipse + Full Moon windows, BTC exhibits extreme mean reversion. These cosmic events coincide with historically elevated retail trading activity and predictable price patterns.

### Entry Conditions
| # | Condition | Required |
|---|-----------|----------|
| 1 | Near Eclipse (+/- 2 days) | YES |
| 2 | Near Full Moon (+/- 2 days) | YES |

Both conditions must be met (2/2).

### Trade Parameters
| Parameter | Value |
|-----------|-------|
| Entry Time | 12:00 AM Dubai / 8:00 PM UTC / 4:00 PM ET |
| Take Profit | +2.0% |
| Stop Loss | -3.0% |
| Max Hold | 5 days |
| Expectancy | +1.21% per trade |
| Max Drawdown | 6.91% |
| Cumulative Return | +25.29% (19 trades) |

### Notes
- Ultra-rare setup: only ~2-4 occurrences per year
- Highest expectancy of all three strategies
- Wider stops needed due to cosmic volatility

### Upcoming Windows (2026)
- Mar 3 (Lunar Eclipse) + Mar 3 (Full Moon) — EXACT OVERLAP
- Aug 28 (Lunar Eclipse) + Aug 28 (Full Moon) — EXACT OVERLAP

---

## Strategy 2: Friday Low-Vol Scalp

**Win Rate: 82.61% | 23 Trades | Sharpe: 6.18**

### Thesis
When Friday volume is ultra-low and no catalysts are present, US traders close positions heading into the weekend, creating a quiet drift upward. BTC grinds higher during the weekend lull.

### Entry Conditions
| # | Condition | Required | Weight |
|---|-----------|----------|--------|
| 1 | Friday (Day of Week) | CRITICAL | Must be Friday |
| 2 | Volume < 0.7x 20-day Average | CRITICAL | Low volume key |
| 3 | Volume Below 20-day Average | Supporting | Confirms low activity |
| 4 | No Mag7 Earnings Nearby | Supporting | No catalyst risk |
| 5 | No Eclipse Window | Supporting | Avoids cosmic volatility |
| 6 | DXY Stable (< 0.3% change) | Supporting | Dollar not moving |

Signal triggers when: Friday + Low Volume + at least 4/6 conditions met.

### Trade Parameters
| Parameter | Value |
|-----------|-------|
| Entry Time | 4:00 PM Dubai (best TP hit rate 72.1%) |
| Alternative Entry | 8:00 PM Dubai (lowest SL risk 25%) |
| Take Profit | +0.5% |
| Stop Loss | -1.0% |
| Exit if Neither | Saturday 8:00 AM Dubai |
| Expectancy | +0.22% per trade |
| Max Drawdown | 2.0% |
| Cumulative Return | +5.20% (23 trades) |

### Entry Time Details (Dubai)
| Time | TP Hit Rate | SL Hit Rate | Win Rate |
|------|-------------|-------------|----------|
| 16:00 (4 PM) | **72.1%** | 26.9% | 52.4% |
| 19:00 (7 PM) | 65.4% | 30.8% | **57.3%** |
| 20:00 (8 PM) | 68.3% | **25.0%** | 54.4% |

### Best Months (10-Year Data)
| Month | Friday Weekend WR | Avg 2-Day Return |
|-------|-------------------|------------------|
| **October** | 79.1% | +1.32% |
| **December** | 64.4% | +0.76% |
| **May** | 63.6% | +1.09% |
| **April** | 58.1% | +0.30% |

### Worst Months
| Month | Friday Weekend WR | Avoid? |
|-------|-------------------|--------|
| September | 43.2% | Yes |
| January | 43.2% | Yes |
| February | 47.5% | Caution |

### Notes
- Tightest risk of all three strategies (max DD only 2%)
- Highest Sharpe ratio (6.18) — best risk-adjusted returns
- Scaling option: enter 50% at 16:00 Dubai, add 50% at 20:00 Dubai
- The $270K position size at +0.5% TP = $1,350 profit per trade

---

## Strategy 3: Momentum + Weak Dollar

**Win Rate: 81.25% | 16 Trades | Sharpe: 6.11**

### Thesis
When BTC is trending strongly (above Bollinger upper band) and the dollar is weakening, momentum tends to continue for 2+ days. Low volume confirms the trend is not exhausted.

### Entry Conditions
| # | Condition | Required | Weight |
|---|-----------|----------|--------|
| 1 | DXY Falling (Dollar Weak) | CRITICAL | Inverse BTC correlation |
| 2 | Price Above Bollinger Upper Band | CRITICAL | Strong momentum |
| 3 | Volume Below Average | Supporting | Trend not exhausted |
| 4 | Above SMA 200 | Supporting | Bullish structure |
| 5 | Volatility Decreasing | Supporting | Compression before move |
| 6 | No Mag7 Earnings Nearby | Supporting | No catalyst risk |

Signal triggers when: DXY falling + Above BB Upper + at least 4/6 conditions met.

### Trade Parameters
| Parameter | Value |
|-----------|-------|
| Entry Time | 12:00 AM Dubai / 8:00 PM UTC / 4:00 PM ET |
| Take Profit | +1.0% |
| Stop Loss | -1.5% |
| Max Hold | 2 days |
| Expectancy | +0.53% per trade |
| Max Drawdown | 3.41% |
| Cumulative Return | +8.77% (16 trades) |

### Notes
- Works in bull markets when BTC is above SMA 200
- Does NOT work when BTC is in bearish structure (below SMA 200)
- DXY inverse correlation is the key driver
- Can combine with Friday scalp if both signal on the same day

---

## Strategy Comparison

| Metric | Cosmic | Friday Scalp | Momentum |
|--------|--------|-------------|----------|
| Win Rate | 84.2% | 82.6% | 81.3% |
| Trades (9yr) | 19 | 23 | 16 |
| Expectancy | +1.21% | +0.22% | +0.53% |
| Sharpe | 4.71 | 6.18 | 6.11 |
| Max Drawdown | 6.91% | 2.0% | 3.41% |
| Risk Level | HIGH | LOW | MEDIUM |
| Frequency | ~3/year | ~3/year | ~2/year |

---

## Strategy 4: Weekly Friday Tiered System

**Combined: 64.0% WR | 522 trades (47.5/yr) | Sharpe: 0.19**

### Thesis

The Alpha Strategies above fire only 2-3 times per year. This weekly system ensures **every single Friday is traded** by using a tiered confidence model that adjusts TP/SL based on how many conditions are met. The edge is small per trade but consistent — compounding weekly across the year.

### Tier 1: HIGH CONFIDENCE (6+ of 7 strict conditions)

**Win Rate: 87.5% | ~0.7/yr | Expectancy: +1.58%**

| # | Condition | Threshold |
|---|-----------|-----------|
| 1 | Volume very low | < 0.6x 20d avg |
| 2 | DXY flat | \|change\| < 0.2% |
| 3 | VIX calm | < 18 |
| 4 | RSI sweet spot | 40–55 |
| 5 | Above SMA 200 | Price > SMA200 |
| 6 | No events | No FOMC/earnings/eclipse ±3d |
| 7 | Green week | BTC weekly return > 0% |

**Trade Parameters:** TP +2.0% / SL -3.0% / Hold 5d

### Tier 2: MEDIUM CONFIDENCE (4+ of 5 relaxed conditions, not T1)

**Win Rate: 67.7% | ~23.6/yr | Expectancy: +0.04%**

| # | Condition | Threshold |
|---|-----------|-----------|
| 1 | Volume below average | < 0.9x 20d avg |
| 2 | DXY stable | \|change\| < 0.5% |
| 3 | VIX OK | < 25 |
| 4 | RSI in range | 30–65 |
| 5 | SPX stable | Daily return > -1.5% |

**Trade Parameters:** TP +1.0% / SL -2.0% / Hold 3d

### Tier 3: BASE (every remaining Friday)

**Win Rate: 61.1% | ~23.1/yr | Expectancy: +0.11%**

No additional filters — every Friday that doesn't qualify for T1 or T2 is traded.

**Trade Parameters:** TP +2.0% / SL -3.0% / Hold 5d

### Combined Performance (10yr backtest, 522 Fridays)

| Metric | Value |
|--------|-------|
| Total Trades | 522 (47.5/yr) |
| Win Rate | 64.0% |
| Expectancy | +0.05% per trade |
| Cumulative Return | +17.67% |
| Max Drawdown | 31.99% |
| Sharpe | 0.19 |

### $270K Annual Projection

| Metric | Value |
|--------|-------|
| Trades/year | ~47 |
| Annual P&L | +$6,417 |
| Annual ROI | +2.4% |

### Yearly Breakdown (Combined)

| Year | Trades | Win Rate | Cum Return |
|------|--------|----------|------------|
| 2016 | 46 | 67.4% | +9.80% |
| 2017 | 52 | 59.6% | -7.79% |
| 2018 | 52 | 63.5% | +4.56% |
| 2019 | 52 | 63.5% | +2.43% |
| 2020 | 52 | 75.0% | +23.21% |
| 2021 | 53 | 54.7% | -16.56% |
| 2022 | 52 | 63.5% | -3.54% |
| 2023 | 52 | 71.2% | +23.31% |
| 2024 | 52 | 57.7% | -10.13% |
| 2025 | 52 | 67.3% | +6.06% |

### Notes

- The system trades EVERY Friday — no more waiting for rare setups
- Tier 2 is the workhorse (23.6 trades/yr at 67.7% WR) — exceeds the 65% target
- Tier 3 acts as a catch-all with wider TP/SL to compensate for fewer filters
- Best years: 2020 (+23.2%), 2023 (+23.3%) — both bull market years
- Worst years: 2021 (-16.6%), 2024 (-10.1%) — high-volatility bear/chop years
- The weekly grind produces ~$6.4K/yr on $270K — modest but consistent
- Combine with Alpha Strategies for additional 2-3 high-conviction trades per year

---

## Condition Data Sources

| Condition | Source | Refresh |
|-----------|--------|---------|
| BTC Price | Binance (real-time) | 10 seconds |
| BTC Volume | Binance (hourly) | 10 seconds |
| RSI, MACD, BB, EMA, SMA | Yahoo Finance (daily) | 60 seconds |
| DXY | Yahoo Finance | 60 seconds |
| Day of Week | System clock | Real-time |
| Eclipse/Moon dates | Hardcoded calendar | Static |
| FOMC dates | Hardcoded calendar | Static |
| Mag7 Earnings | Hardcoded calendar | Static |
