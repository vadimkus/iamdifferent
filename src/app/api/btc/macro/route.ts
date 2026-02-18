import { NextResponse } from 'next/server';
import { fredSeries } from '@/lib/btc-data';

export const revalidate = 3600;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

export async function GET() {
  try {
    const [m2, walcl, dff, yc] = await Promise.all([
      fredSeries('M2SL', '2015-01-01'),
      fredSeries('WALCL', '2020-01-01'),
      fredSeries('DFF', '2024-01-01'),
      fredSeries('T10Y2Y', '2024-01-01'),
    ]);

    const m2Latest = m2[m2.length - 1].value;
    const m2Prev = m2[m2.length - 2].value;
    const m2_12mo = m2.length >= 13 ? m2[m2.length - 13].value : m2[0].value;
    const m2Yoy = ((m2Latest - m2_12mo) / m2_12mo) * 100;

    return NextResponse.json({
      m2_latest: ns(m2Latest),
      m2_change_mom: ns(m2Latest - m2Prev),
      m2_yoy_pct: ns(m2Yoy),
      m2_history: m2.map((d) => ({ date: d.date, value: Math.round(d.value * 10) / 10 })),
      fed_balance_sheet: ns(walcl[walcl.length - 1].value / 1e6),
      fed_funds_rate: ns(dff[dff.length - 1].value),
      yield_curve_10y2y: ns(yc[yc.length - 1].value),
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
