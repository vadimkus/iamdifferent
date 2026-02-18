import { NextResponse } from 'next/server';
import { yfChart } from '@/lib/btc-data';

export const revalidate = 3600;

function ns(v: number) {
  return Math.round(v * 1000) / 1000;
}

function pctReturns(candles: { close: number }[]) {
  const r: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    r.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
  }
  return r;
}

function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  let sumA = 0, sumB = 0;
  for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i]; }
  const meanA = sumA / n, meanB = sumB / n;
  let cov = 0, varA = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - meanA) * (b[i] - meanB);
    varA += (a[i] - meanA) ** 2;
    varB += (b[i] - meanB) ** 2;
  }
  return cov / (Math.sqrt(varA) * Math.sqrt(varB));
}

function rollingCorrelation(a: number[], b: number[], window: number) {
  const result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    if (i < window - 1) { result.push(NaN); continue; }
    const sliceA = a.slice(i - window + 1, i + 1);
    const sliceB = b.slice(i - window + 1, i + 1);
    result.push(correlation(sliceA, sliceB));
  }
  return result;
}

export async function GET() {
  try {
    const [btcC, spxC, goldC] = await Promise.all([
      yfChart('BTC-USD', '1y', '1d'),
      yfChart('^GSPC', '1y', '1d'),
      yfChart('GC=F', '1y', '1d'),
    ]);

    // Align by date string (YYYY-MM-DD)
    const dateKey = (iso: string) => iso.slice(0, 10);
    const btcMap = new Map(btcC.map((c) => [dateKey(c.date), c.close]));
    const spxMap = new Map(spxC.map((c) => [dateKey(c.date), c.close]));
    const goldMap = new Map(goldC.map((c) => [dateKey(c.date), c.close]));

    const allDates = Array.from(btcMap.keys()).filter((d) => spxMap.has(d) && goldMap.has(d)).sort();

    const btcP = allDates.map((d) => btcMap.get(d)!);
    const spxP = allDates.map((d) => spxMap.get(d)!);
    const goldP = allDates.map((d) => goldMap.get(d)!);

    const btcR = pctReturns(btcP.map((p) => ({ close: p })));
    const spxR = pctReturns(spxP.map((p) => ({ close: p })));
    const goldR = pctReturns(goldP.map((p) => ({ close: p })));
    const dates = allDates.slice(1);

    const rollBtcSpx = rollingCorrelation(btcR, spxR, 30);
    const rollBtcGold = rollingCorrelation(btcR, goldR, 30);

    const corrHistory = dates
      .map((d, i) => ({
        date: d,
        btc_spx: Number.isNaN(rollBtcSpx[i]) ? null : ns(rollBtcSpx[i]),
        btc_gold: Number.isNaN(rollBtcGold[i]) ? null : ns(rollBtcGold[i]),
      }))
      .filter((d) => d.btc_spx !== null);

    return NextResponse.json({
      matrix: {
        btc_spx: ns(correlation(btcR, spxR)),
        btc_gold: ns(correlation(btcR, goldR)),
        spx_gold: ns(correlation(spxR, goldR)),
      },
      rolling_30d: corrHistory,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
