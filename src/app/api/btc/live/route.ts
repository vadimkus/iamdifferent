import { NextResponse } from 'next/server';
import { yfChart, calcRSI, calcMACD, calcBollinger, ema, sma } from '@/lib/btc-data';

export const revalidate = 120;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

export async function GET() {
  try {
    const [btcCandles, spxCandles] = await Promise.all([
      yfChart('BTC-USD', '2y', '1d'),
      yfChart('^GSPC', '6mo', '1d'),
    ]);

    // --- BTC ---
    const closes = btcCandles.map((c) => c.close);
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

    // --- SPX ---
    const spxCloses = spxCandles.map((c) => c.close);
    const sn = spxCloses.length;
    const spxLast = spxCloses[sn - 1];
    const spxPrev = spxCloses[sn - 2];
    const spxChange = ((spxLast - spxPrev) / spxPrev) * 100;
    const spxRsi = calcRSI(spxCloses);
    const spxEma20 = ema(spxCloses, 20);
    const spxEma50 = ema(spxCloses, 50);
    const spxSma50 = sma(spxCloses, 50);
    const spxSma200 = sma(spxCloses, 200);
    const { macdLine: spxMacd, signal: spxSig, histogram: spxHist } = calcMACD(spxCloses);

    // SPX high/low for context
    const spx5d = spxCloses.slice(-5);
    const spx20d = spxCloses.slice(-20);
    const spxHigh52w = Math.max(...spxCloses);
    const spxLow52w = Math.min(...spxCloses);
    const spxFromHigh = ((spxLast - spxHigh52w) / spxHigh52w) * 100;

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

      spx: {
        price: ns(spxLast),
        change_pct: ns(spxChange),
        rsi_14: ns(spxRsi[sn - 1]),
        ema_20: ns(spxEma20[sn - 1]),
        ema_50: ns(spxEma50[sn - 1]),
        sma_50: ns(spxSma50[sn - 1]),
        sma_200: ns(spxSma200[sn - 1]),
        macd: ns(spxMacd[sn - 1]),
        macd_signal: ns(spxSig[sn - 1]),
        macd_hist: ns(spxHist[sn - 1]),
        high_52w: ns(spxHigh52w),
        low_52w: ns(spxLow52w),
        from_high_pct: ns(spxFromHigh),
        range_5d: { high: ns(Math.max(...spx5d)), low: ns(Math.min(...spx5d)) },
        range_20d: { high: ns(Math.max(...spx20d)), low: ns(Math.min(...spx20d)) },
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
