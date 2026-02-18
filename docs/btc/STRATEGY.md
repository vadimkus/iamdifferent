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
