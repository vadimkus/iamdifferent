import { NextResponse } from 'next/server';
import { yfChart, calcRSI, calcMACD, calcBollinger, ema, sma } from '@/lib/btc-data';

export const revalidate = 120;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

export async function GET() {
  try {
    const candles = await yfChart('BTC-USD', '6mo', '1d');
    const closes = candles.map((c) => c.close);
    const n = closes.length;

    const rsi = calcRSI(closes);
    const { macdLine, signal, histogram } = calcMACD(closes);
    const bb = calcBollinger(closes);
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const sma200 = sma(closes, 200);

    const last = closes[n - 1];
    const prev = closes[n - 2];
    const changePct = ((last - prev) / prev) * 100;

    return NextResponse.json({
      price: ns(last),
      change_pct: ns(changePct),
      rsi_14: ns(rsi[n - 1]),
      macd: ns(macdLine[n - 1]),
      macd_signal: ns(signal[n - 1]),
      macd_hist: ns(histogram[n - 1]),
      bb_upper: ns(bb.upper[n - 1]),
      bb_mid: ns(bb.mid[n - 1]),
      bb_lower: ns(bb.lower[n - 1]),
      ema_20: ns(ema20[n - 1]),
      ema_50: ns(ema50[n - 1]),
      sma_200: ns(sma200[n - 1]),
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
