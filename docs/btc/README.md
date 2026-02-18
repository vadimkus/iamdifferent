# BTC Dubai Session Trader — Documentation

## Overview

A live trading dashboard and backtested strategy engine for BTC spot trading, optimized for Dubai timezone execution. Built on Next.js with real-time Binance data, Yahoo Finance indicators, and FRED macroeconomic data.

**Live Dashboard:** [iamdifferent.vercel.app/btc](https://iamdifferent.vercel.app/btc)

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [STRATEGY.md](./STRATEGY.md) | 3 Alpha Strategies (80%+ WR) + Weekly Friday Tiered System (64% WR, 47 trades/yr) |
| [FRIDAY_TIMING.md](./FRIDAY_TIMING.md) | Friday optimal entry time analysis — 10yr backtest results |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, APIs, data sources, refresh cycles |
| [BACKTESTING.md](./BACKTESTING.md) | Deep backtesting methodology, results, and research findings |
| [EXECUTION_PLAYBOOK.md](./EXECUTION_PLAYBOOK.md) | Step-by-step trade execution checklist for Friday scalps |

---

## Quick Summary

### The Edge

Friday afternoon (Dubai time), when US session volume dies and no catalysts are present, BTC drifts upward into the weekend. This pattern has been backtested across 10 years of daily data and 2 years of hourly data.

### Weekly Friday Strategy (Trade Every Week)

4. **Tiered Friday System** — 64.0% WR, 47.5 trades/yr, 3-tier confidence model
   - **Tier 1** (HIGH): 87.5% WR, ~0.7/yr — 6+/7 strict conditions, TP +2%, SL -3%
   - **Tier 2** (MEDIUM): 67.7% WR, ~23.6/yr — 4+/5 relaxed conditions, TP +1%, SL -2%
   - **Tier 3** (BASE): 61.1% WR, ~23.1/yr — every remaining Friday, TP +2%, SL -3%
   - **$270K projection**: ~$6,417/yr (+2.4% ROI)

### Three Alpha Strategies (80%+ Win Rate, Rare)

1. **Cosmic Convergence** — 84.2% WR, 19 trades, Eclipse + Full Moon window
2. **Friday Low-Vol Scalp** — 82.6% WR, 23 trades, Friday + low volume + no catalysts
3. **Momentum + Weak Dollar** — 81.3% WR, 16 trades, DXY falling + above Bollinger

### Optimal Friday Entry Time

| Rank | Dubai | UTC | ET | TP Hit Rate | SL Hit Rate |
|------|-------|-----|-----|-------------|-------------|
| #1 | **16:00** | 12:00 | 07:00 | 72.1% | 26.9% |
| #2 | 19:00 | 15:00 | 10:00 | 65.4% | 30.8% |
| #3 | 20:00 | 16:00 | 11:00 | 68.3% | 25.0% |

### How the Two Systems Work Together

| | Weekly Tiered (every Friday) | Alpha Strategies (rare) |
|-|------------------------------|------------------------|
| **Frequency** | ~47 trades/year | 2-3 trades/year |
| **Win Rate** | 61-88% (tier-dependent) | 81-84% |
| **Dashboard** | "This Friday's Trade" card | Alpha Strategies cards |
| **Entry Logic** | Tier assigned automatically | All conditions must align |
| **Price Levels** | Shown only during buy window | Shown when signal active |
| **Annual P&L ($270K)** | ~$6.4K (consistent) | ~$8-15K (rare, high-conviction) |

**Run both in parallel.** The Weekly Tiered system provides steady income every Friday. Alpha Strategies add 2-3 high-conviction trades per year on top.

### Data Sources

- **Binance** — Real-time BTC price, order book, volume (10s refresh)
- **Yahoo Finance** — RSI, MACD, Bollinger, EMA/SMA, SPX, DXY, VIX
- **FRED** — M2 Money Supply, Fed Funds Rate, Balance Sheet, Yield Curve
- **Static Calendars** — FOMC dates, Mag7 earnings, eclipses, moon phases (2024-2026)

---

## Research Pipeline

Three offline Python scripts generate all backtest data:

```bash
cd btc
pip3 install -r requirements.txt

python3 research.py           # 508 strategy combos → research_results.json (~2 min)
python3 weekly_strategy.py    # Tiered Friday system → weekly_strategy_results.json (~12 sec)
python3 friday_timing.py      # Friday entry hours → friday_timing_results.json (~15 sec)
```

After re-running, update hardcoded tier configs in `src/app/api/btc/weekly-strategy/route.ts` if optimal TP/SL changed.

---

## Project Structure

```
IAMDIFFERENT/
├── src/app/btc/page.tsx              # Dashboard (React client component)
├── src/app/api/btc/
│   ├── binance/route.ts              # Binance real-time feed
│   ├── live/route.ts                 # Yahoo Finance BTC + SPX + VIX
│   ├── alpha-strategy/route.ts       # Alpha strategy engine (Binance + Yahoo)
│   ├── weekly-strategy/route.ts      # Weekly Friday tiered strategy (Binance + Yahoo)
│   ├── friday-timing/route.ts        # Friday timing analysis results
│   ├── chart/route.ts                # BTC OHLC chart data
│   ├── events/route.ts               # Calendar events (lunar, FOMC, earnings)
│   ├── macro/route.ts                # FRED macroeconomic data
│   ├── dxy/route.ts                  # Dollar index
│   ├── correlations/route.ts         # BTC/SPX/Gold correlations
│   └── sessions/route.ts             # Hourly session stats
├── src/lib/
│   ├── btc-data.ts                   # Shared data fetchers + indicator math
│   └── market-events.ts              # Hardcoded event calendars
├── btc/
│   ├── research.py                   # Deep backtesting engine (Python)
│   ├── research_results.json         # Backtesting output (508 strategies)
│   ├── weekly_strategy.py             # Weekly tiered Friday backtest (Python)
│   ├── weekly_strategy_results.json   # Weekly strategy output (522 Fridays)
│   ├── friday_timing.py              # Friday entry time analysis (Python)
│   ├── friday_timing_results.json    # Friday timing output
│   ├── server.py                     # Legacy local Flask server
│   └── requirements.txt              # Python dependencies
└── docs/btc/                         # This documentation
```
