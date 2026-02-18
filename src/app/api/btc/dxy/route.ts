import { NextResponse } from 'next/server';
import { yfChart } from '@/lib/btc-data';

export const revalidate = 300;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

export async function GET() {
  try {
    const candles = await yfChart('DX-Y.NYB', '1mo', '1d');
    const n = candles.length;
    const last = candles[n - 1].close;
    const prev = candles[n - 2].close;
    return NextResponse.json({
      dxy: ns(last),
      change_pct: ns(((last - prev) / prev) * 100),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
