import { NextResponse } from 'next/server';
import { yfChart, calcRSI, ema, sma, fredSeries } from '@/lib/btc-data';

export const revalidate = 300;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

interface Condition {
  id: string;
  name: string;
  description: string;
  value: string;
  met: boolean;
  edge: string;
  weight: number;
}

export async function GET() {
  try {
    const [btcDaily, dxyDaily, goldDaily, spxDaily] = await Promise.all([
      yfChart('BTC-USD', '6mo', '1d'),
      yfChart('DX-Y.NYB', '1mo', '1d'),
      yfChart('GC=F', '1mo', '1d'),
      yfChart('^GSPC', '1mo', '1d'),
    ]);

    const m2Data = await fredSeries('M2SL', '2024-01-01');

    const closes = btcDaily.map((c) => c.close);
    const volumes = btcDaily.map((c) => c.volume);
    const n = closes.length;

    const rsiArr = calcRSI(closes);
    const currentRSI = rsiArr[n - 1] ?? 50;
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const sma200 = sma(closes, 200);
    const currentPrice = closes[n - 1];

    // Volume ratio (current vs 20-day avg)
    const vol20Avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volRatio = volumes[n - 1] / vol20Avg;

    // DXY daily change
    const dxyN = dxyDaily.length;
    const dxyChange = dxyN >= 2 ? ((dxyDaily[dxyN - 1].close - dxyDaily[dxyN - 2].close) / dxyDaily[dxyN - 2].close) * 100 : 0;

    // Gold daily change
    const goldN = goldDaily.length;
    const goldChange = goldN >= 2 ? ((goldDaily[goldN - 1].close - goldDaily[goldN - 2].close) / goldDaily[goldN - 2].close) * 100 : 0;

    // SPX daily change
    const spxN = spxDaily.length;
    const spxChange = spxN >= 2 ? ((spxDaily[spxN - 1].close - spxDaily[spxN - 2].close) / spxDaily[spxN - 2].close) * 100 : 0;

    // M2 YoY growth
    const m2Len = m2Data.length;
    const m2Yoy = m2Len >= 13 ? ((m2Data[m2Len - 1].value - m2Data[m2Len - 13].value) / m2Data[m2Len - 13].value) * 100 : 0;

    // Day of week (UTC)
    const today = new Date();
    const utcDay = today.getUTCDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[utcDay];
    const isBestDay = [2, 3, 4].includes(utcDay); // Tue, Wed, Thu

    // Month
    const month = today.getUTCMonth() + 1;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const isBestMonth = [5, 6, 11, 12].includes(month); // May, Jun, Nov, Dec

    // Trend
    const belowEma20 = currentPrice < ema20[n - 1];
    const belowEma50 = currentPrice < ema50[n - 1];
    const belowBoth = belowEma20 && belowEma50;
    const sma200Val = sma200[n - 1];

    const conditions: Condition[] = [
      {
        id: 'rsi_oversold',
        name: 'RSI < 30 (Oversold)',
        description: 'Strongest single indicator. 60.9% win rate, +9.0% edge over baseline.',
        value: `RSI = ${ns(currentRSI)}`,
        met: currentRSI < 30,
        edge: '+9.0%',
        weight: 3,
      },
      {
        id: 'rsi_below_50',
        name: 'RSI < 50 (Weakness)',
        description: 'Core condition. Strategy works best when BTC shows weakness before the overnight session.',
        value: `RSI = ${ns(currentRSI)}`,
        met: currentRSI < 50,
        edge: '+3.3%',
        weight: 2,
      },
      {
        id: 'best_day',
        name: 'Tuesday / Wednesday / Thursday',
        description: 'Best days historically. Thursday: 59.1% win rate (+7.3% edge). Monday is worst (-7.8%).',
        value: dayName,
        met: isBestDay,
        edge: '+5.5%',
        weight: 2,
      },
      {
        id: 'downtrend',
        name: 'Below EMA20 & EMA50 (Downtrend)',
        description: 'Counter-intuitive: overnight bounce strategy works best during downtrends. 57.4% win, +5.5% edge.',
        value: belowBoth ? 'Below both' : belowEma20 ? 'Below EMA20 only' : 'Above both',
        met: belowBoth,
        edge: '+5.5%',
        weight: 2,
      },
      {
        id: 'spx_down',
        name: 'SPX Down > 0.5% (Risk-Off Day)',
        description: 'BTC overnight recovery strongest after risk-off days. 59.6% win rate, +7.7% edge.',
        value: `SPX ${ns(spxChange)}%`,
        met: spxChange < -0.5,
        edge: '+7.7%',
        weight: 2,
      },
      {
        id: 'gold_down',
        name: 'Gold Down > 0.5% (Risk-On Shift)',
        description: 'Gold selling signals rotation back into risk assets. 59.3% win rate, +7.4% edge.',
        value: `Gold ${ns(goldChange)}%`,
        met: goldChange < -0.5,
        edge: '+7.4%',
        weight: 1,
      },
      {
        id: 'volume_low',
        name: 'Volume Below Average',
        description: 'Low volume + RSI<50 + best day = 61.4% win rate, +9.6% edge. Exhaustion selling.',
        value: `Vol ratio: ${ns(volRatio)}x`,
        met: volRatio < 1.0,
        edge: '+9.6%',
        weight: 1,
      },
      {
        id: 'best_month',
        name: 'Best Month (May/Jun/Nov/Dec)',
        description: 'Seasonal sweet spot. Nov: 58.8% win, Dec: 62.8% win. Combined with RSI<50: 66.7% win.',
        value: monthNames[month - 1],
        met: isBestMonth,
        edge: '+14.8%',
        weight: 2,
      },
      {
        id: 'dxy_flat',
        name: 'DXY Stable (Not Surging)',
        description: 'Strategy works best when dollar is flat or weakening. DXY flat: 53.8% win, +2.0% edge.',
        value: `DXY ${ns(dxyChange)}%`,
        met: dxyChange <= 0.3,
        edge: '+2.0%',
        weight: 1,
      },
      {
        id: 'm2_expanding',
        name: 'M2 Money Supply Expanding',
        description: 'Liquidity tailwind for BTC. Expanding M2 supports overnight recovery thesis.',
        value: `M2 YoY: ${ns(m2Yoy)}%`,
        met: m2Yoy > 0,
        edge: 'macro',
        weight: 1,
      },
      {
        id: 'above_sma200',
        name: 'Above SMA 200 (Long-Term Trend)',
        description: 'Long-term trend filter. Strategy has better risk/reward above the 200-day moving average.',
        value: sma200Val ? `SMA200: $${ns(sma200Val)?.toLocaleString()}` : 'N/A (< 200 days)',
        met: sma200Val ? currentPrice > sma200Val : true,
        edge: 'trend',
        weight: 1,
      },
    ];

    const totalWeight = conditions.reduce((a, c) => a + c.weight, 0);
    const metWeight = conditions.filter((c) => c.met).reduce((a, c) => a + c.weight, 0);
    const score = Math.round((metWeight / totalWeight) * 100);
    const metCount = conditions.filter((c) => c.met).length;

    let recommendation: string;
    let confidence: string;
    if (score >= 75) { recommendation = 'STRONG BUY'; confidence = 'high'; }
    else if (score >= 55) { recommendation = 'BUY'; confidence = 'medium'; }
    else if (score >= 40) { recommendation = 'WEAK BUY'; confidence = 'low'; }
    else { recommendation = 'NO TRADE'; confidence = 'none'; }

    // Best combo check
    const bestComboMet = currentRSI < 50 && isBestDay && isBestMonth;
    const bestComboNote = bestComboMet
      ? 'GOLDEN SETUP: RSI<50 + Best Day + Best Month = 70.3% win rate historically!'
      : null;

    return NextResponse.json({
      score,
      recommendation,
      confidence,
      conditions,
      met_count: metCount,
      total_count: conditions.length,
      best_combo_active: bestComboMet,
      best_combo_note: bestComboNote,
      current: {
        price: ns(currentPrice),
        rsi: ns(currentRSI),
        day: dayName,
        month: monthNames[month - 1],
        vol_ratio: ns(volRatio),
        dxy_change: ns(dxyChange),
        gold_change: ns(goldChange),
        spx_change: ns(spxChange),
        m2_yoy: ns(m2Yoy),
        above_ema20: !belowEma20,
        above_ema50: !belowEma50,
        above_sma200: sma200Val ? currentPrice > sma200Val : null,
      },
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
