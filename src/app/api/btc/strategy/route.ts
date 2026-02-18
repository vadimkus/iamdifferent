import { NextResponse } from 'next/server';
import { yfChart } from '@/lib/btc-data';

export const revalidate = 1800;

const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Trade {
  date: string;
  buy: number;
  sell: number;
  return_pct: number;
  dow: string;
  month: number;
  year: number;
}

function computeStats(trades: Trade[]) {
  const returns = trades.map((t) => t.return_pct);
  const wins = returns.filter((r) => r > 0).length;
  const losses = returns.length - wins;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sorted = [...returns].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const cum = returns.reduce((a, b) => a + b, 0);
  const std = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(365) : 0;

  const byDay = DOW_NAMES.map((day) => {
    const dt = trades.filter((t) => t.dow === day);
    if (!dt.length) return null;
    const w = dt.filter((t) => t.return_pct > 0).length;
    return {
      day, trades: dt.length,
      win_rate: Math.round((w / dt.length) * 1000) / 10,
      avg_return: Math.round((dt.reduce((a, t) => a + t.return_pct, 0) / dt.length) * 10000) / 10000,
      cum_return: Math.round(dt.reduce((a, t) => a + t.return_pct, 0) * 100) / 100,
    };
  }).filter(Boolean);

  const byMonth = MONTH_NAMES.map((name, idx) => {
    const dt = trades.filter((t) => t.month === idx + 1);
    if (!dt.length) return null;
    const w = dt.filter((t) => t.return_pct > 0).length;
    return {
      month: name, trades: dt.length,
      win_rate: Math.round((w / dt.length) * 1000) / 10,
      avg_return: Math.round((dt.reduce((a, t) => a + t.return_pct, 0) / dt.length) * 10000) / 10000,
      cum_return: Math.round(dt.reduce((a, t) => a + t.return_pct, 0) * 100) / 100,
    };
  }).filter(Boolean);

  const years = [...new Set(trades.map((t) => t.year))].sort();
  const byYear = years.map((yr) => {
    const dt = trades.filter((t) => t.year === yr);
    const w = dt.filter((t) => t.return_pct > 0).length;
    return {
      year: yr, trades: dt.length,
      win_rate: Math.round((w / dt.length) * 1000) / 10,
      cum_return: Math.round(dt.reduce((a, t) => a + t.return_pct, 0) * 100) / 100,
    };
  });

  let equity = 10000;
  const equityCurve = trades.map((t) => {
    equity *= 1 + t.return_pct / 100;
    return { date: t.date, equity: Math.round(equity * 100) / 100 };
  });

  return {
    summary: {
      total_trades: trades.length,
      win_rate: Math.round((wins / trades.length) * 1000) / 10,
      wins, losses,
      avg_return: Math.round(mean * 10000) / 10000,
      median_return: Math.round(median * 10000) / 10000,
      cum_return: Math.round(cum * 100) / 100,
      max_win: Math.round(Math.max(...returns) * 100) / 100,
      max_loss: Math.round(Math.min(...returns) * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
    },
    by_day: byDay,
    by_month: byMonth,
    by_year: byYear,
    equity_curve: equityCurve,
    recent_trades: trades.slice(-30),
  };
}

export async function GET() {
  try {
    // --- 2-year hourly backtest (precise: buy 8PM UTC, sell 2AM UTC) ---
    const hourlyCandles = await yfChart('BTC-USD', '2y', '1h');

    const byKey = new Map<string, number>();
    for (const c of hourlyCandles) {
      const d = new Date(c.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}_${d.getUTCHours()}`;
      byKey.set(key, c.close);
    }

    const dateSet = new Set<string>();
    for (const c of hourlyCandles) {
      const d = new Date(c.date);
      dateSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
    }
    const hourlyDates = Array.from(dateSet).sort();

    const hourlyTrades: Trade[] = [];
    for (let i = 0; i < hourlyDates.length - 1; i++) {
      const bp = byKey.get(`${hourlyDates[i]}_20`);
      const sp = byKey.get(`${hourlyDates[i + 1]}_2`);
      if (bp == null || sp == null) continue;
      const ret = ((sp - bp) / bp) * 100;
      const d = new Date(hourlyDates[i] + 'T00:00:00Z');
      hourlyTrades.push({
        date: hourlyDates[i],
        buy: Math.round(bp * 100) / 100,
        sell: Math.round(sp * 100) / 100,
        return_pct: Math.round(ret * 10000) / 10000,
        dow: DOW_NAMES[d.getUTCDay()],
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      });
    }

    // --- 10-year daily backtest (proxy: buy at daily close, sell at next open) ---
    const dailyCandles = await yfChart('BTC-USD', '10y', '1d');

    const dailyTrades: Trade[] = [];
    for (let i = 0; i < dailyCandles.length - 1; i++) {
      const bp = dailyCandles[i].close;
      const sp = dailyCandles[i + 1].open;
      if (bp == null || sp == null) continue;
      const ret = ((sp - bp) / bp) * 100;
      const d = new Date(dailyCandles[i].date);
      dailyTrades.push({
        date: dailyCandles[i].date.slice(0, 10),
        buy: Math.round(bp * 100) / 100,
        sell: Math.round(sp * 100) / 100,
        return_pct: Math.round(ret * 10000) / 10000,
        dow: DOW_NAMES[d.getUTCDay()],
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      });
    }

    const hourlyResult = computeStats(hourlyTrades);
    const dailyResult = computeStats(dailyTrades);

    return NextResponse.json({
      // 2-year hourly (precise)
      ...hourlyResult,
      summary: { ...hourlyResult.summary, label: '2Y Hourly (Buy 8PM UTC / Sell 2AM UTC)' },
      // 10-year daily (proxy)
      daily_10y: {
        ...dailyResult,
        summary: { ...dailyResult.summary, label: '10Y Daily (Buy Close / Sell Next Open)' },
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
