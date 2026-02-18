import { NextResponse } from 'next/server';
import { yfChart } from '@/lib/btc-data';

export const revalidate = 3600;

export async function GET() {
  try {
    const candles = await yfChart('BTC-USD', '2y', '1h');

    // Compute hourly pct returns
    const hourlyReturns = new Map<number, number[]>();
    for (let i = 0; i < 24; i++) hourlyReturns.set(i, []);

    for (let i = 1; i < candles.length; i++) {
      const ret = ((candles[i].close - candles[i - 1].close) / candles[i - 1].close) * 100;
      const h = new Date(candles[i].date).getUTCHours();
      hourlyReturns.get(h)!.push(ret);
    }

    const stats = [];
    for (let h = 0; h < 24; h++) {
      const r = hourlyReturns.get(h)!;
      const avg = r.reduce((a, b) => a + b, 0) / r.length;
      const wins = r.filter((v) => v > 0).length;
      const std = Math.sqrt(r.reduce((a, b) => a + (b - avg) ** 2, 0) / r.length);
      stats.push({
        hour_utc: h,
        hour_dubai: (h + 4) % 24,
        avg_return: Math.round(avg * 10000) / 10000,
        win_rate: Math.round((wins / r.length) * 1000) / 10,
        volatility: Math.round(std * 10000) / 10000,
        count: r.length,
      });
    }

    return NextResponse.json({ hourly_stats: stats });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
