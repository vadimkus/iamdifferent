import { NextResponse } from 'next/server';
import { yfChart, calcRSI, ema, sma, calcBollinger } from '@/lib/btc-data';
import {
  daysToFullMoon, nearEclipse, nearbyEarnings, moonPhaseToday,
  daysToNextFOMC,
} from '@/lib/market-events';

export const revalidate = 300;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

interface AlphaCondition {
  id: string;
  label: string;
  met: boolean;
  value: string;
}

interface AlphaSetup {
  id: string;
  name: string;
  description: string;
  signal: 'BUY' | 'NO_TRADE';
  confidence: number;
  conditions: AlphaCondition[];
  met_count: number;
  total_count: number;
  backtest: {
    win_rate: number;
    trades: number;
    expectancy: number;
    sharpe: number;
    max_drawdown: number;
    cum_return: number;
    target_pct: number;
    stop_pct: number;
    hold_days: number;
  };
}

export async function GET() {
  try {
    const [btcDaily, dxyDaily] = await Promise.all([
      yfChart('BTC-USD', '6mo', '1d'),
      yfChart('DX-Y.NYB', '1mo', '1d'),
    ]);

    const closes = btcDaily.map((c) => c.close);
    const volumes = btcDaily.map((c) => c.volume);
    const n = closes.length;

    const rsiArr = calcRSI(closes);
    const currentRSI = rsiArr[n - 1] ?? 50;
    const ema20 = ema(closes, 20);
    const sma200 = sma(closes, 200);
    const bb = calcBollinger(closes);
    const currentPrice = closes[n - 1];

    const vol20Avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volRatio = volumes[n - 1] / vol20Avg;

    const dxyN = dxyDaily.length;
    const dxyChange = dxyN >= 2 ? ((dxyDaily[dxyN - 1].close - dxyDaily[dxyN - 2].close) / dxyDaily[dxyN - 2].close) * 100 : 0;

    const today = new Date();
    const utcDay = today.getUTCDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const eclipseInfo = nearEclipse(today);
    const fullMoonDays = daysToFullMoon(today);
    const nearFullMoon = fullMoonDays <= 2;
    const earningsTickers = nearbyEarnings(today);
    const fomcInfo = daysToNextFOMC(today);

    const bbUpper = bb.upper[bb.upper.length - 1];
    const bbLower = bb.lower[bb.lower.length - 1];
    const bbMid = bb.mid[bb.mid.length - 1];
    const bbPct = bbUpper && bbLower ? (currentPrice - bbLower) / (bbUpper - bbLower) : 0.5;
    const aboveBBUpper = bbPct > 1.0;
    const sma200Val = sma200[n - 1];

    // Detect VIX falling (use BTC volatility as proxy since we don't fetch VIX here)
    const recentVol = closes.slice(-5).map((c, i, arr) =>
      i > 0 ? Math.abs((c - arr[i - 1]) / arr[i - 1]) : 0
    );
    const avgRecentVol = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
    const prevVol = closes.slice(-10, -5).map((c, i, arr) =>
      i > 0 ? Math.abs((c - arr[i - 1]) / arr[i - 1]) : 0
    );
    const avgPrevVol = prevVol.reduce((a, b) => a + b, 0) / prevVol.length;
    const volFalling = avgRecentVol < avgPrevVol;

    const isFriday = utcDay === 5;
    const isLowVol = volRatio < 0.7;
    const isDxyDown = dxyChange < 0;
    const noEarnings = earningsTickers.length === 0;
    const noEclipse = !eclipseInfo.near;
    const aboveSMA200 = sma200Val ? currentPrice > sma200Val : false;
    const dxyFlat = Math.abs(dxyChange) < 0.3;

    // ===== SETUP 1: Eclipse + Full Moon Cosmic Convergence =====
    const s1_conditions: AlphaCondition[] = [
      { id: 'eclipse', label: 'Near Eclipse (+/- 2 days)', met: eclipseInfo.near, value: eclipseInfo.near ? `${eclipseInfo.label}` : 'No eclipse nearby' },
      { id: 'full_moon', label: 'Near Full Moon (+/- 2 days)', met: nearFullMoon, value: nearFullMoon ? `${fullMoonDays}d away` : `${fullMoonDays}d away` },
    ];
    const s1_met = s1_conditions.filter((c) => c.met).length;

    // ===== SETUP 2: Friday Low-Volume Scalp =====
    const s2_conditions: AlphaCondition[] = [
      { id: 'friday', label: 'Friday (Day of Week)', met: isFriday, value: dayNames[utcDay] },
      { id: 'low_vol', label: 'Volume < 0.7x Average', met: isLowVol, value: `${ns(volRatio)}x avg` },
      { id: 'vol_below', label: 'Volume Below 20d Average', met: volRatio < 1.0, value: `${ns(volRatio)}x` },
      { id: 'no_earnings', label: 'No Mag7 Earnings Nearby', met: noEarnings, value: noEarnings ? 'Clear' : earningsTickers.join(', ') },
      { id: 'no_eclipse_s2', label: 'No Eclipse Window', met: noEclipse, value: noEclipse ? 'Clear' : `${eclipseInfo.label}` },
      { id: 'dxy_flat', label: 'DXY Stable (< 0.3%)', met: dxyFlat, value: `DXY ${ns(dxyChange)}%` },
    ];
    const s2_met = s2_conditions.filter((c) => c.met).length;

    // ===== SETUP 3: Momentum + Low Vol + Dollar Weak =====
    const s3_conditions: AlphaCondition[] = [
      { id: 'dxy_down', label: 'DXY Falling (Dollar Weak)', met: isDxyDown, value: `DXY ${ns(dxyChange)}%` },
      { id: 'bb_upper', label: 'Price Above Bollinger Upper Band', met: aboveBBUpper, value: `BB%: ${ns(bbPct ? bbPct * 100 : 0)}%` },
      { id: 'vol_below_s3', label: 'Volume Below Average', met: volRatio < 1.0, value: `${ns(volRatio)}x avg` },
      { id: 'above_sma200', label: 'Above SMA 200', met: aboveSMA200, value: sma200Val ? `SMA200: $${ns(sma200Val)?.toLocaleString()}` : 'N/A' },
      { id: 'vol_falling', label: 'Volatility Decreasing', met: volFalling, value: volFalling ? 'Vol falling' : 'Vol rising' },
      { id: 'no_earnings_s3', label: 'No Mag7 Earnings Nearby', met: noEarnings, value: noEarnings ? 'Clear' : earningsTickers.join(', ') },
    ];
    const s3_met = s3_conditions.filter((c) => c.met).length;

    const setups: AlphaSetup[] = [
      {
        id: 'cosmic',
        name: 'Cosmic Convergence',
        description: 'Eclipse + Full Moon window. BTC shows extreme mean reversion during cosmic events. Ultra-rare but highest win rate. Buy at close, target +2%, stop -3%, hold up to 5 days.',
        signal: s1_met === 2 ? 'BUY' : 'NO_TRADE',
        confidence: s1_met === 2 ? 95 : s1_met === 1 ? 40 : 0,
        conditions: s1_conditions,
        met_count: s1_met,
        total_count: 2,
        backtest: {
          win_rate: 84.21,
          trades: 19,
          expectancy: 1.21,
          sharpe: 4.71,
          max_drawdown: 6.91,
          cum_return: 25.29,
          target_pct: 2.0,
          stop_pct: -3.0,
          hold_days: 5,
        },
      },
      {
        id: 'friday_scalp',
        name: 'Friday Low-Vol Scalp',
        description: 'Friday + ultra-low volume + no catalysts = quiet weekend setup. BTC drifts up into weekend. Buy at Friday close, take +0.5% profit, -1% stop, exit same day or Monday open.',
        signal: s2_met >= 4 && isFriday && isLowVol ? 'BUY' : 'NO_TRADE',
        confidence: isFriday && isLowVol && noEarnings ? Math.min(95, s2_met * 16) : 0,
        conditions: s2_conditions,
        met_count: s2_met,
        total_count: s2_conditions.length,
        backtest: {
          win_rate: 82.61,
          trades: 23,
          expectancy: 0.22,
          sharpe: 6.18,
          max_drawdown: 2.0,
          cum_return: 5.2,
          target_pct: 0.5,
          stop_pct: -1.0,
          hold_days: 1,
        },
      },
      {
        id: 'momentum_dollar',
        name: 'Momentum + Weak Dollar',
        description: 'BTC above Bollinger upper band + DXY falling + low volume = strong trend continuation. Ride the momentum with tight risk. Target +1-2%, stop -1.5 to -3%, hold 2-5 days.',
        signal: s3_met >= 4 && isDxyDown && aboveBBUpper ? 'BUY' : 'NO_TRADE',
        confidence: isDxyDown && aboveBBUpper ? Math.min(95, s3_met * 16) : 0,
        conditions: s3_conditions,
        met_count: s3_met,
        total_count: s3_conditions.length,
        backtest: {
          win_rate: 81.25,
          trades: 16,
          expectancy: 0.53,
          sharpe: 6.11,
          max_drawdown: 4.4,
          cum_return: 8.8,
          target_pct: 1.0,
          stop_pct: -1.5,
          hold_days: 2,
        },
      },
    ];

    const anyBuy = setups.some((s) => s.signal === 'BUY');
    const bestSetup = setups.reduce((best, s) => s.confidence > best.confidence ? s : best, setups[0]);

    return NextResponse.json({
      overall_signal: anyBuy ? 'BUY' : 'NO_TRADE',
      best_setup: bestSetup.id,
      best_confidence: bestSetup.confidence,
      setups,
      context: {
        price: ns(currentPrice),
        rsi: ns(currentRSI),
        day: dayNames[utcDay],
        vol_ratio: ns(volRatio),
        dxy_change: ns(dxyChange),
        bb_pct: ns(bbPct ? bbPct * 100 : null),
        above_sma200: aboveSMA200,
        moon: moonPhaseToday(today),
        eclipse: eclipseInfo.label,
        fomc_days: fomcInfo.days,
        earnings: earningsTickers,
      },
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
