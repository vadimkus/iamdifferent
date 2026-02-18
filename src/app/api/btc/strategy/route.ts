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
}

export async function GET() {
  try {
    const candles = await yfChart('BTC-USD', '2y', '1h');

    // Index candles by date-hour for fast lookup
    const byKey = new Map<string, number>();
    for (const c of candles) {
      const d = new Date(c.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}_${d.getUTCHours()}`;
      byKey.set(key, c.close);
    }

    // Collect unique dates
    const dateSet = new Set<string>();
    for (const c of candles) {
      const d = new Date(c.date);
      dateSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
    }
    const dates = Array.from(dateSet).sort();

    const BUY_HOUR = 20;
    const SELL_HOUR = 2;
    const trades: Trade[] = [];

    for (let i = 0; i < dates.length - 1; i++) {
      const buyKey = `${dates[i]}_${BUY_HOUR}`;
      const sellKey = `${dates[i + 1]}_${SELL_HOUR}`;
      const bp = byKey.get(buyKey);
      const sp = byKey.get(sellKey);
      if (bp == null || sp == null) continue;

      const ret = ((sp - bp) / bp) * 100;
      const d = new Date(dates[i] + 'T00:00:00Z');
      trades.push({
        date: dates[i],
        buy: Math.round(bp * 100) / 100,
        sell: Math.round(sp * 100) / 100,
        return_pct: Math.round(ret * 10000) / 10000,
        dow: DOW_NAMES[d.getUTCDay()],
        month: d.getUTCMonth() + 1,
      });
    }

    const returns = trades.map((t) => t.return_pct);
    const wins = returns.filter((r) => r > 0).length;
    const losses = returns.length - wins;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const sorted = [...returns].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const cum = returns.reduce((a, b) => a + b, 0);
    const std = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length);
    const sharpe = std > 0 ? (mean / std) * Math.sqrt(365) : 0;

    // Day-of-week breakdown
    const byDay = DOW_NAMES.map((day) => {
      const dt = trades.filter((t) => t.dow === day);
      if (!dt.length) return null;
      const w = dt.filter((t) => t.return_pct > 0).length;
      return {
        day,
        trades: dt.length,
        win_rate: Math.round((w / dt.length) * 1000) / 10,
        avg_return: Math.round((dt.reduce((a, t) => a + t.return_pct, 0) / dt.length) * 10000) / 10000,
        cum_return: Math.round(dt.reduce((a, t) => a + t.return_pct, 0) * 100) / 100,
      };
    }).filter(Boolean);

    // Month breakdown
    const byMonth = MONTH_NAMES.map((name, idx) => {
      const dt = trades.filter((t) => t.month === idx + 1);
      if (!dt.length) return null;
      const w = dt.filter((t) => t.return_pct > 0).length;
      return {
        month: name,
        trades: dt.length,
        win_rate: Math.round((w / dt.length) * 1000) / 10,
        avg_return: Math.round((dt.reduce((a, t) => a + t.return_pct, 0) / dt.length) * 10000) / 10000,
        cum_return: Math.round(dt.reduce((a, t) => a + t.return_pct, 0) * 100) / 100,
      };
    }).filter(Boolean);

    // Equity curve
    let equity = 10000;
    const equityCurve = trades.map((t) => {
      equity *= 1 + t.return_pct / 100;
      return { date: t.date, equity: Math.round(equity * 100) / 100 };
    });

    return NextResponse.json({
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
      equity_curve: equityCurve,
      recent_trades: trades.slice(-30),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
