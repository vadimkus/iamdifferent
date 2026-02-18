# BTC Dubai Session Trader — Documentation

## Overview

A live trading dashboard and backtested strategy engine for BTC spot trading, optimized for Dubai timezone execution. Built on Next.js with real-time Binance data, Yahoo Finance indicators, and FRED macroeconomic data.

**Live Dashboard:** [iamdifferent.vercel.app/btc](https://iamdifferent.vercel.app/btc)

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [STRATEGY.md](./STRATEGY.md) | All 3 Alpha Strategies with entry/exit rules, conditions, and risk parameters |
| [FRIDAY_TIMING.md](./FRIDAY_TIMING.md) | Friday optimal entry time analysis — 10yr backtest results |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, APIs, data sources, refresh cycles |
| [BACKTESTING.md](./BACKTESTING.md) | Deep backtesting methodology, results, and research findings |
| [EXECUTION_PLAYBOOK.md](./EXECUTION_PLAYBOOK.md) | Step-by-step trade execution checklist for Friday scalps |

---

## Quick Summary

### The Edge

Friday afternoon (Dubai time), when US session volume dies and no catalysts are present, BTC drifts upward into the weekend. This pattern has been backtested across 10 years of daily data and 2 years of hourly data.

### Three Alpha Strategies (80%+ Win Rate)

1. **Cosmic Convergence** — 84.2% WR, 19 trades, Eclipse + Full Moon window
2. **Friday Low-Vol Scalp** — 82.6% WR, 23 trades, Friday + low volume + no catalysts
3. **Momentum + Weak Dollar** — 81.3% WR, 16 trades, DXY falling + above Bollinger

### Optimal Friday Entry Time

| Rank | Dubai | UTC | ET | TP Hit Rate | SL Hit Rate |
|------|-------|-----|-----|-------------|-------------|
| #1 | **16:00** | 12:00 | 07:00 | 72.1% | 26.9% |
| #2 | 19:00 | 15:00 | 10:00 | 65.4% | 30.8% |
| #3 | 20:00 | 16:00 | 11:00 | 68.3% | 25.0% |

### Data Sources

- **Binance** — Real-time BTC price, order book, volume (10s refresh)
- **Yahoo Finance** — RSI, MACD, Bollinger, EMA/SMA, SPX, DXY, VIX
- **FRED** — M2 Money Supply, Fed Funds Rate, Balance Sheet, Yield Curve

---

## Project Structure

```
IAMDIFFERENT/
├── src/app/btc/page.tsx              # Dashboard (React client component)
├── src/app/api/btc/
│   ├── binance/route.ts              # Binance real-time feed
│   ├── live/route.ts                 # Yahoo Finance BTC + SPX + VIX
│   ├── alpha-strategy/route.ts       # Alpha strategy engine (Binance + Yahoo)
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
│   ├── friday_timing.py              # Friday entry time analysis (Python)
│   ├── friday_timing_results.json    # Friday timing output
│   ├── server.py                     # Legacy local Flask server
│   └── requirements.txt              # Python dependencies
└── docs/btc/                         # This documentation
```
