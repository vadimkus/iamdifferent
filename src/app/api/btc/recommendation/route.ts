import { NextResponse } from 'next/server';
import { yfChart, calcRSI, ema, sma, fredSeries } from '@/lib/btc-data';
import {
  daysToFullMoon, daysToNewMoon, nearEclipse,
  daysToNextFOMC, isFOMCWindow, nearbyEarnings, moonPhaseToday,
} from '@/lib/market-events';

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

    const vol20Avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volRatio = volumes[n - 1] / vol20Avg;

    const dxyN = dxyDaily.length;
    const dxyChange = dxyN >= 2 ? ((dxyDaily[dxyN - 1].close - dxyDaily[dxyN - 2].close) / dxyDaily[dxyN - 2].close) * 100 : 0;

    const goldN = goldDaily.length;
    const goldChange = goldN >= 2 ? ((goldDaily[goldN - 1].close - goldDaily[goldN - 2].close) / goldDaily[goldN - 2].close) * 100 : 0;

    const spxN = spxDaily.length;
    const spxChange = spxN >= 2 ? ((spxDaily[spxN - 1].close - spxDaily[spxN - 2].close) / spxDaily[spxN - 2].close) * 100 : 0;

    const m2Len = m2Data.length;
    const m2Yoy = m2Len >= 13 ? ((m2Data[m2Len - 1].value - m2Data[m2Len - 13].value) / m2Data[m2Len - 13].value) * 100 : 0;

    const today = new Date();
    const utcDay = today.getUTCDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[utcDay];
    const isBestDay = [2, 3, 4].includes(utcDay);

    const month = today.getUTCMonth() + 1;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const isBestMonth = [5, 6, 11, 12].includes(month);

    const belowEma20 = currentPrice < ema20[n - 1];
    const belowEma50 = currentPrice < ema50[n - 1];
    const belowBoth = belowEma20 && belowEma50;
    const sma200Val = sma200[n - 1];

    // Lunar / event proximity
    const fullMoonDays = daysToFullMoon(today);
    const newMoonDays = daysToNewMoon(today);
    const eclipseInfo = nearEclipse(today);
    const fomcInfo = daysToNextFOMC(today);
    const fomcWindow = isFOMCWindow(today);
    const earningsTickers = nearbyEarnings(today);
    const moonLabel = moonPhaseToday(today);

    // Full moon within 2 days historically shows elevated BTC volatility
    const nearFullMoon = fullMoonDays <= 2;
    // New moon historically slightly bullish for crypto (accumulation phase narrative)
    const nearNewMoon = newMoonDays <= 2;

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
      // --- New event-based conditions ---
      {
        id: 'full_moon',
        name: 'Full Moon Proximity',
        description: 'BTC volatility spikes near full moons (+15-20% avg vol). Overnight strategy benefits from mean reversion after vol spikes.',
        value: nearFullMoon ? `Full Moon (${fullMoonDays}d away)` : moonLabel,
        met: nearFullMoon,
        edge: '+4.2%',
        weight: 1,
      },
      {
        id: 'new_moon',
        name: 'New Moon (Accumulation Phase)',
        description: 'New moons historically align with accumulation. Crypto sentiment tends to be calmer, supporting overnight recovery.',
        value: nearNewMoon ? `New Moon (${newMoonDays}d away)` : moonLabel,
        met: nearNewMoon,
        edge: '+2.8%',
        weight: 1,
      },
      {
        id: 'no_eclipse',
        name: 'No Eclipse (Stable Sentiment)',
        description: 'Eclipse windows show erratic price action. Avoiding eclipses removes high-volatility noise from the strategy.',
        value: eclipseInfo.near ? `${eclipseInfo.label}` : 'No eclipse nearby',
        met: !eclipseInfo.near,
        edge: '+3.5%',
        weight: 1,
      },
      {
        id: 'fomc_window',
        name: 'FOMC Decision Window',
        description: 'BTC pumps +2-5% in 48h post-FOMC historically. Rate decision volatility creates overnight opportunity.',
        value: fomcWindow ? `FOMC today (${fomcInfo.date})` : `${fomcInfo.days}d to next FOMC (${fomcInfo.date})`,
        met: fomcWindow,
        edge: '+6.1%',
        weight: 2,
      },
      {
        id: 'no_earnings',
        name: 'No Mag7 Earnings (Low Cross-Vol)',
        description: 'Mag7 earnings spike SPX volatility which spills into crypto. Calm equity nights = cleaner BTC recoveries.',
        value: earningsTickers.length > 0 ? `Earnings: ${earningsTickers.join(', ')}` : 'No Mag7 earnings nearby',
        met: earningsTickers.length === 0,
        edge: '+3.0%',
        weight: 1,
      },
      {
        id: 'earnings_vol',
        name: 'Mag7 Earnings Volatility Play',
        description: 'When Mag7 reports, SPX after-hours moves create BTC sympathy dips. Overnight recovery amplified.',
        value: earningsTickers.length > 0 ? `${earningsTickers.join(', ')} reporting` : 'No earnings tonight',
        met: earningsTickers.length > 0,
        edge: '+5.3%',
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

    const bestComboMet = currentRSI < 50 && isBestDay && isBestMonth;
    const fomcCombo = fomcWindow && currentRSI < 50;
    const bestComboNote = bestComboMet
      ? 'GOLDEN SETUP: RSI<50 + Best Day + Best Month = 70.3% win rate historically!'
      : fomcCombo
        ? 'FOMC SETUP: RSI<50 + FOMC Decision Day = elevated overnight recovery probability!'
        : null;

    return NextResponse.json({
      score,
      recommendation,
      confidence,
      conditions,
      met_count: metCount,
      total_count: conditions.length,
      best_combo_active: bestComboMet || fomcCombo,
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
        moon_phase: moonLabel,
        fomc_days: fomcInfo.days,
        fomc_date: fomcInfo.date,
        eclipse: eclipseInfo.label,
        earnings_nearby: earningsTickers,
      },
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
