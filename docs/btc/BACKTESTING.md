# Backtesting Results

## Research Methodology

### Data
- **BTC-USD**: 10 years daily (Feb 2016 — Feb 2026), 2 years hourly
- **SPX (^GSPC)**: 10 years daily
- **Gold (GC=F)**: 10 years daily
- **DXY (DX-Y.NYB)**: 10 years daily
- **VIX (^VIX)**: 10 years daily

### Indicators Computed (per asset)
- RSI (7, 14)
- EMA (9, 20, 50)
- SMA (200)
- MACD (12/26/9)
- Bollinger Bands (20, 2σ)
- ATR (14)
- Volume ratio (vs 20-day average)
- Daily, weekly, monthly returns
- Rolling correlations (BTC/SPX, BTC/Gold)

### Event Flags
- Full Moon proximity (+/- 2 days)
- New Moon proximity (+/- 2 days)
- Eclipse proximity (+/- 2 days)
- FOMC meeting window (+/- 2 days)
- Mag7 earnings proximity (+/- 3 days)
- Day of week (Monday through Sunday)
- Month, quarter

### Backtest Engine
- **Target/Stop/Hold model**: For each entry, simulate forward N days checking if TP or SL hits first, or hold expires
- **Vectorized execution**: Uses NumPy `fwd_Nd_high` and `fwd_Nd_low` rolling windows for O(n) performance instead of O(n²) row iteration
- **508 strategy combinations tested** across single, double, triple, and quad condition combos
- **Runtime**: ~2 minutes for full research pipeline

---

## Top Strategies Found

### By Win Rate (minimum 10 trades)

| Rank | Strategy | Win Rate | Trades | Expectancy | Sharpe |
|------|----------|----------|--------|------------|--------|
| 1 | Eclipse + Full Moon | 84.21% | 19 | +1.21% | 4.71 |
| 2 | Friday + Low Vol | 82.61% | 23 | +0.22% | 6.18 |
| 3 | Above BB Upper + DXY Down | 81.25% | 16 | +0.53% | 6.11 |

### "Holy Grail" Strategies (80%+ WR, positive expectancy, 10+ trades)

All three Alpha Strategies qualify. No other combinations from the 508 tested achieved 80%+ win rate with sufficient trade count.

### By Expectancy

| Rank | Strategy | Expectancy | Win Rate | Trades |
|------|----------|------------|----------|--------|
| 1 | Eclipse + Full Moon | +1.21% | 84.21% | 19 |
| 2 | Above BB Upper + DXY Down | +0.53% | 81.25% | 16 |
| 3 | Friday + Low Vol | +0.22% | 82.61% | 23 |

### By Composite Score
Composite = (WR × 3) + (Expectancy × 100) + (Sharpe × 10) - (MaxDD × 5)

All three strategies scored in the top 5 of the composite ranking.

---

## Friday Timing Analysis

### Methodology
1. Filtered 2 years of hourly BTC data to Fridays only (104 Fridays)
2. For each entry hour (12:00 — 23:00 UTC), simulated:
   - TP: +0.5% hit within 24 hours
   - SL: -1.0% hit within 24 hours
   - Exit at Saturday 8:00 AM Dubai (04:00 UTC) if neither
3. Cross-tabulated by month for seasonal patterns
4. Analyzed volume effect (low vs high volume Fridays)

### Entry Hour Rankings

| Rank | Dubai | UTC | ET | TP Hit | SL Hit | WR (Sat 8AM) | Score |
|------|-------|-----|----|--------|--------|-------------|-------|
| 1 | **16:00** | 12:00 | 07:00 | **72.1%** | 26.9% | 52.4% | 418.4 |
| 2 | 19:00 | 15:00 | 10:00 | 65.4% | 30.8% | **57.3%** | 409.7 |
| 3 | 20:00 | 16:00 | 11:00 | 68.3% | **25.0%** | 54.4% | 404.7 |
| 4 | 18:00 | 14:00 | 09:00 | 58.7% | 36.5% | 56.3% | 386.1 |
| 5 | 21:00 | 17:00 | 12:00 | 65.4% | 27.9% | 47.6% | 371.5 |
| 6 | 03:00 | 23:00 | 18:00 | 58.3% | 19.4% | 51.5% | 371.3 |

### Scoring Formula
`Score = (TP_hit_rate × 3) + (WR_sat_8am × 2) + (WR_sat_10am × 1.5) + (avg_return × 100) + (SL_rate < 15% ? 30 : 0)`

### Best Month × Hour Combinations

| Month | Hour (Dubai) | Win Rate | Trades | Avg Return |
|-------|-------------|----------|--------|------------|
| Dec | 20:00 | **100%** | 8 | +0.64% |
| Mar | 01:00 | 88.9% | 9 | +0.39% |
| Jun | 23:00 | 87.5% | 8 | +0.44% |
| Jun | 22:00 | 87.5% | 8 | +0.37% |
| Feb | 00:00 | 85.7% | 7 | +0.78% |

### 10-Year Monthly Friday Performance

| Month | Fridays | 1d WR | 1d Avg | 2d WR | 2d Avg |
|-------|---------|-------|--------|-------|--------|
| Jan | 44 | 52.3% | +0.42% | 43.2% | -0.33% |
| Feb | 40 | 57.5% | +0.44% | 47.5% | -0.08% |
| Mar | 45 | 51.1% | -0.48% | 51.1% | +0.10% |
| Apr | 43 | 58.1% | +0.28% | 58.1% | +0.30% |
| **May** | 44 | **65.9%** | +0.74% | **63.6%** | **+1.09%** |
| Jun | 43 | 53.5% | +0.04% | 60.5% | +0.23% |
| Jul | 44 | 54.5% | +0.22% | 52.3% | -0.33% |
| Aug | 44 | 52.3% | +0.31% | 47.7% | +0.27% |
| Sep | 44 | 45.5% | +0.08% | 43.2% | -0.01% |
| **Oct** | 43 | **69.8%** | +0.63% | **79.1%** | **+1.32%** |
| Nov | 43 | 53.5% | -0.05% | 44.2% | +0.25% |
| **Dec** | 45 | 60.0% | +0.32% | 64.4% | +0.76% |

### Volume Effect

Low-volume Fridays consistently outperform high-volume Fridays at the 20:00 Dubai entry:
- Low volume: 57.7% WR, +0.22% avg (52 trades)
- High volume: 51.0% WR, -0.10% avg (51 trades)

This confirms the strategy thesis: quiet Fridays drift up, volatile Fridays are unpredictable.

---

## Strategies That Did NOT Work

The research also identified patterns that seem appealing but don't hold up:

1. **Buy every Sunday night** — 50.2% WR, near-random
2. **Buy when RSI < 20** — Too few trades (7 in 9 years), unreliable
3. **FOMC day plays** — 53% WR, high variance, not edge enough
4. **New Moon entries** — 51.8% WR, no statistically significant edge
5. **Buy when VIX > 30** — High win rate (68%) but only 11 trades and huge drawdowns
6. **Overnight US→Asia every night** — 52-58% WR depending on conditions, too low for the risk

---

## Reproducing Results

```bash
cd btc

# Full strategy research (508 combos, ~2 min)
python3 research.py
# Output: research_results.json

# Friday timing analysis (~15 sec)
python3 friday_timing.py
# Output: friday_timing_results.json
```

Results are deterministic given the same date range (data from Yahoo Finance may shift slightly as historical data updates).
