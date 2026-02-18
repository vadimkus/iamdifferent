# Execution Playbook — Friday Low-Vol Scalp

## Pre-Trade Checklist (Thursday Night / Friday Morning)

Complete this checklist before every Friday trade. All items marked CRITICAL must pass.

### 1. Calendar Check
- [ ] **CRITICAL**: No Mag7 earnings this week (AAPL, MSFT, GOOG, AMZN, META, NVDA, TSLA)
- [ ] **CRITICAL**: No FOMC meeting within +/- 2 days
- [ ] **CRITICAL**: No eclipse within +/- 2 days
- [ ] Check: What month is it? (Oct/Dec/May = aggressive, Sep/Jan/Nov = cautious)

### 2. Dashboard Check (Friday morning)
Open: [iamdifferent.vercel.app/btc](https://iamdifferent.vercel.app/btc)

- [ ] Alpha Strategies section: Friday Low-Vol Scalp conditions — how many met?
- [ ] Binance volume ratio: is it below 0.7x? (LOW VOLUME flag)
- [ ] DXY change: is it < 0.3%? (stable dollar)
- [ ] Market pressure: not extreme SELL_PRESSURE
- [ ] RSI: not extremely oversold (< 20) — could mean crash, not scalp territory

---

## Trade Execution

### Step 1: Monitor (Friday 15:00 Dubai / 11:00 UTC)
- Open dashboard, check conditions are aligning
- Open Binance spot BTCUSDT on desktop
- Set up limit order template (don't execute yet)

### Step 2: Final Check (Friday 15:45 Dubai)
- Refresh dashboard — confirm:
  - [ ] Volume still LOW (< 0.7x)
  - [ ] DXY still stable
  - [ ] No sudden news/events
  - [ ] Order book: no massive sell wall within 1% above price
  - [ ] Bid/ask spread is normal (< $1)

### Step 3: Entry (Friday 16:00 Dubai sharp)
- **Exchange**: Binance Spot
- **Pair**: BTC/USDT
- **Order Type**: Market (for guaranteed fill) or Limit at ask price
- **Amount**: $270,000 USDT (or your planned size)
- **Record**: Entry price, exact time

### Step 4: Set Exits Immediately After Fill
| Exit | Calculation | Order Type |
|------|-------------|------------|
| **Take Profit** | Entry price × 1.005 | Limit sell |
| **Stop Loss** | Entry price × 0.99 | Stop-limit sell |

Example at $67,000 entry:
- TP: $67,335 (limit sell)
- SL: $66,330 (stop-limit sell)

### Step 5: Monitor (Friday 16:00 — Saturday 08:00 Dubai)
- Check every 1-2 hours (or set alerts on Binance app)
- **Do NOT move your stop loss down** — respect the -1% SL
- If price drifts sideways with no TP/SL hit, that's fine — exit at Saturday 8AM Dubai

### Step 6: Exit
One of three outcomes:

| Outcome | Action | Expected Frequency |
|---------|--------|-------------------|
| **TP hit (+0.5%)** | Auto-filled, cancel SL order | 72.1% of trades |
| **SL hit (-1%)** | Auto-filled, cancel TP order | 26.9% of trades |
| **Neither by Sat 8AM** | Manual market sell at 08:00 Dubai | ~1% of trades |

### Step 7: Record
Log in your trade journal:
- Date, entry time, entry price
- Exit time, exit price, outcome (TP/SL/timeout)
- Conditions met count (from dashboard)
- Any notes on market conditions

---

## Position Sizing

### Standard (when 4-5/6 conditions met)
| Account Size | Position | TP Profit | SL Loss |
|-------------|----------|-----------|---------|
| $270,000 | $270,000 (100%) | +$1,350 | -$2,700 |

### Scaling Entry (recommended for large positions)
| Tranche | Time | Amount | Rationale |
|---------|------|--------|-----------|
| 1st | 16:00 Dubai | 50% ($135K) | Best TP hit rate |
| 2nd | 20:00 Dubai | 50% ($135K) | Lowest SL hit rate |

### Reduced (when only 4/6 conditions met, or cautious month)
| Account Size | Position | TP Profit | SL Loss |
|-------------|----------|-----------|---------|
| $270,000 | $135,000 (50%) | +$675 | -$1,350 |

### Skip (when < 4 conditions met, or eclipse/FOMC active)
Do not trade. Wait for next Friday.

---

## Decision Matrix

| Conditions Met | Month Quality | Action |
|---------------|---------------|--------|
| 6/6 | Oct/Dec/May | Full size, aggressive |
| 5/6 | Any good month | Full size |
| 4/6 | Good month | Reduced size (50%) |
| 4/6 | Bad month (Sep/Jan) | Skip |
| < 4/6 | Any | Skip |
| Eclipse active | Any | Skip |
| FOMC within 2 days | Any | Skip |

---

## Emergency Procedures

### Flash Crash During Hold
- If BTC drops > 3% in 1 hour while you're in the trade, your SL should have already triggered
- If SL didn't trigger (exchange issue), market sell immediately
- Do not "average down" on a Friday scalp — it's a 1-trade, 1-exit strategy

### Exchange Outage
- If Binance is down at entry time, skip the trade
- If Binance goes down during the trade, your TP/SL orders are on the exchange and will execute when it comes back
- Do not panic

### Unexpected News
- Major hack, regulatory news, or black swan: market sell immediately regardless of P&L
- The backtest assumes normal market conditions — tail events are not captured

---

## Weekly Schedule

| Day | Time (Dubai) | Action |
|-----|-------------|--------|
| Thursday | Evening | Check calendar (earnings, FOMC, eclipses) |
| Friday | 10:00 | Check dashboard conditions |
| Friday | 15:00 | Final pre-trade review |
| Friday | 15:45 | Set up orders on Binance |
| Friday | **16:00** | **EXECUTE ENTRY** |
| Friday | 16:00-00:00 | Monitor (hourly check) |
| Saturday | 00:00-08:00 | Monitor (2-3 hour check) |
| Saturday | **08:00** | **EXIT if TP/SL not hit** |
| Saturday | After trade | Log results |

---

## Expected Annual Performance

Based on backtested data (assuming ~20-25 valid Friday setups per year):

| Metric | Conservative | Expected | Aggressive |
|--------|-------------|----------|-----------|
| Trades/year | 15 | 20 | 25 |
| Win rate | 75% | 82.6% | 85% |
| Avg profit (TP) | +$1,350 | +$1,350 | +$1,350 |
| Avg loss (SL) | -$2,700 | -$2,700 | -$2,700 |
| Annual P&L | +$4,725 | +$12,690 | +$18,563 |
| Annual ROI | +1.8% | +4.7% | +6.9% |
| Max drawdown | -$5,400 | -$5,400 | -$5,400 |

These are conservative estimates for a spot-only, no-leverage strategy. The edge is small per trade but consistent.

---

# Execution Playbook — Weekly Tiered Friday System

## How It Works

Unlike the Alpha Strategies (2-3 trades/year), the Weekly Tiered System trades **every single Friday**. The dashboard automatically assigns a tier based on current conditions:

| Tier | Color | Conditions | TP | SL | Hold | WR |
|------|-------|------------|----|----|------|----|
| 1 (HIGH) | Green | 6+/7 strict | +2.0% | -3.0% | 5d | 87.5% |
| 2 (MEDIUM) | Cyan | 4+/5 relaxed | +1.0% | -2.0% | 3d | 67.7% |
| 3 (BASE) | Amber | Every other Friday | +2.0% | -3.0% | 5d | 61.1% |

## Weekly Routine

| Day | Time (Dubai) | Action |
|-----|-------------|--------|
| Thursday | Evening | Open dashboard, check "This Friday's Trade" section |
| Friday | Morning | Note which tier is showing and trade parameters |
| Friday | **20:00** | **EXECUTE: Buy BTC at market** |
| Friday | 20:01 | Set TP and SL on exchange immediately |
| Sat-Wed | As needed | Monitor — TP/SL will auto-execute |
| Hold day | **20:00** | If TP/SL not hit by max hold, exit at market |

## Position Sizing

All tiers use the full $270K position. The tier system adjusts **TP/SL width**, not position size.

| Tier | TP Profit | SL Loss | Risk/Reward |
|------|-----------|---------|-------------|
| 1 | +$5,400 | -$8,100 | 1:1.5 |
| 2 | +$2,700 | -$5,400 | 1:2.0 |
| 3 | +$5,400 | -$8,100 | 1:1.5 |

## Dashboard Section

The "This Friday's Trade" card shows:
- Active tier (color-coded) with all conditions checked/unchecked
- Exact entry, TP, and SL prices calculated from live BTC price
- Dollar amounts for TP and SL at $270K position
- Buy window status (green pulse when active)
- Annual projection based on backtest results

## Key Differences from Alpha Strategies

| | Alpha Strategies | Weekly Tiered |
|-|-----------------|---------------|
| Frequency | 2-3/year | 47/year |
| Win Rate | 80-85% | 61-88% (tier-dependent) |
| Conditions | All must align | Tiered — always trades |
| Risk per Trade | Higher confidence | Spread across more trades |
| Annual P&L ($270K) | ~$8-15K (rare) | ~$6.4K (consistent) |

**Recommendation:** Run both systems in parallel. The Weekly Tiered system provides steady income while you wait for the rare Alpha Strategy signals.
