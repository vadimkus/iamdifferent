import { NextResponse } from 'next/server';
import { yfChart, calcRSI, sma } from '@/lib/btc-data';
import {
  nearEclipse, nearbyEarnings, daysToNextFOMC,
} from '@/lib/market-events';

export const revalidate = 300;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

const BINANCE_BASES = ['https://api.binance.com', 'https://api.binance.us', 'https://api1.binance.com'];

async function binanceFetch<T>(path: string): Promise<T> {
  for (const base of BINANCE_BASES) {
    try {
      const r = await fetch(`${base}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (r.ok) return r.json() as Promise<T>;
    } catch { /* try next */ }
  }
  throw new Error('Binance unavailable');
}

async function getBinanceData(): Promise<{ price: number; volRatio: number } | null> {
  try {
    const [ticker, klines] = await Promise.all([
      binanceFetch<Record<string, string>>('/api/v3/ticker/24hr?symbol=BTCUSDT'),
      binanceFetch<unknown[][]>('/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24'),
    ]);
    const price = parseFloat(ticker.lastPrice);
    if (isNaN(price) || price <= 0) return null;
    const hourlyVols = klines.map((k: unknown[]) => parseFloat(k[5] as string));
    const avg = hourlyVols.reduce((s: number, v: number) => s + v, 0) / hourlyVols.length;
    const current = hourlyVols[hourlyVols.length - 1] ?? 0;
    return { price, volRatio: avg > 0 ? current / avg : 1 };
  } catch {
    return null;
  }
}

interface TierConfig {
  tp_pct: number;
  sl_pct: number;
  hold_days: number;
  win_rate: number;
  trades: number;
  trades_per_year: number;
  expectancy: number;
  sharpe: number;
  max_drawdown: number;
  cum_return: number;
}

// Hard-coded from backtest results (weekly_strategy_results.json)
const TIER1_CONFIG: TierConfig = {
  tp_pct: 2.0, sl_pct: -3.0, hold_days: 5,
  win_rate: 87.5, trades: 8, trades_per_year: 0.7,
  expectancy: 1.5769, sharpe: 10.16, max_drawdown: 1.39, cum_return: 13.28,
};

const TIER2_CONFIG: TierConfig = {
  tp_pct: 1.0, sl_pct: -2.0, hold_days: 3,
  win_rate: 67.7, trades: 260, trades_per_year: 23.6,
  expectancy: 0.0401, sharpe: 0.21, max_drawdown: 13.59, cum_return: 8.37,
};

const TIER3_CONFIG: TierConfig = {
  tp_pct: 2.0, sl_pct: -3.0, hold_days: 5,
  win_rate: 61.1, trades: 522, trades_per_year: 23.1,
  expectancy: 0.1052, sharpe: 0.32, max_drawdown: 35.8, cum_return: 49.85,
};

const COMBINED_STATS = {
  total_trades: 522, trades_per_year: 47.5, win_rate: 64.0,
  expectancy: 0.0501, cum_return: 17.67, max_drawdown: 31.99, sharpe: 0.19,
  projection_270k: { annual_trades: 47, annual_pnl: 6417, annual_roi_pct: 2.4 },
};

interface TierCondition {
  id: string;
  label: string;
  met: boolean;
  value: string;
}

interface TierResult {
  tier: 1 | 2 | 3;
  tier_label: string;
  color: string;
  signal: 'BUY' | 'WAIT';
  config: TierConfig;
  conditions: TierCondition[];
  met_count: number;
  total_count: number;
  trade_params: {
    entry_price: number | null;
    tp_price: number | null;
    sl_price: number | null;
    tp_dollar: number | null;
    sl_dollar: number | null;
    hold_days: number;
    position_size: number;
  };
  timing: {
    entry_dubai: string;
    exit_dubai: string;
    buy_window_active: boolean;
    window_note: string;
  };
}

export async function GET() {
  try {
    const [btcDaily, dxyDaily, vixDaily, spxDaily, binance] = await Promise.all([
      yfChart('BTC-USD', '2y', '1d'),
      yfChart('DX-Y.NYB', '1mo', '1d'),
      yfChart('^VIX', '1mo', '1d'),
      yfChart('^GSPC', '1mo', '1d'),
      getBinanceData(),
    ]);

    const closes = btcDaily.map(c => c.close);
    const volumes = btcDaily.map(c => c.volume);
    const n = closes.length;

    const currentPrice = binance?.price ?? closes[n - 1];
    const position = 270000;

    // Volume ratio (20d average)
    const vol20Avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const yahooVolRatio = volumes[n - 1] / vol20Avg;
    const volRatio = binance ? binance.volRatio : yahooVolRatio;

    // RSI
    const rsiArr = calcRSI(closes);
    const currentRSI = rsiArr[n - 1] ?? 50;

    // SMA200
    const sma200 = sma(closes, 200);
    const sma200Val = sma200[n - 1];
    const aboveSMA200 = sma200Val ? currentPrice > sma200Val : false;

    // Weekly return (5-bar)
    const weeklyRet = n >= 6 ? ((closes[n - 1] - closes[n - 6]) / closes[n - 6]) * 100 : 0;

    // DXY change
    const dxyN = dxyDaily.length;
    const dxyChange = dxyN >= 2 ? ((dxyDaily[dxyN - 1].close - dxyDaily[dxyN - 2].close) / dxyDaily[dxyN - 2].close) * 100 : 0;

    // VIX
    const vixN = vixDaily.length;
    const vixLevel = vixN > 0 ? vixDaily[vixN - 1].close : 20;

    // SPX daily return
    const spxN = spxDaily.length;
    const spxRet = spxN >= 2 ? ((spxDaily[spxN - 1].close - spxDaily[spxN - 2].close) / spxDaily[spxN - 2].close) * 100 : 0;

    // Events
    const today = new Date();
    const utcDay = today.getUTCDay();
    const utcHour = today.getUTCHours();
    const dubaiHour = (utcHour + 4) % 24;
    const isFriday = utcDay === 5;

    const eclipseInfo = nearEclipse(today);
    const earningsTickers = nearbyEarnings(today);
    const fomcInfo = daysToNextFOMC(today);
    const noEvents = !eclipseInfo.near && earningsTickers.length === 0 && fomcInfo.days > 3;

    // ===== TIER 1 CONDITIONS (6+ of 7 strict) =====
    const t1_conditions: TierCondition[] = [
      { id: 'vol_very_low', label: 'Volume < 0.6x avg', met: volRatio < 0.6, value: `${ns(volRatio)}x` },
      { id: 'dxy_flat', label: 'DXY flat (|chg| < 0.2%)', met: Math.abs(dxyChange) < 0.2, value: `${ns(dxyChange)}%` },
      { id: 'vix_calm', label: 'VIX < 18', met: vixLevel < 18, value: `${ns(vixLevel)}` },
      { id: 'rsi_sweet', label: 'RSI 40-55', met: currentRSI >= 40 && currentRSI <= 55, value: `${ns(currentRSI)}` },
      { id: 'above_sma200', label: 'Above SMA 200', met: aboveSMA200, value: sma200Val ? `$${Math.round(sma200Val).toLocaleString()}` : 'N/A' },
      { id: 'no_events', label: 'No FOMC/earnings/eclipse', met: noEvents, value: noEvents ? 'Clear' : eclipseInfo.near ? 'Eclipse' : earningsTickers.length > 0 ? earningsTickers.join(',') : `FOMC ${fomcInfo.days}d` },
      { id: 'green_week', label: 'BTC green week (>0%)', met: weeklyRet > 0, value: `${ns(weeklyRet)}%` },
    ];
    const t1_met = t1_conditions.filter(c => c.met).length;

    // ===== TIER 2 CONDITIONS (4+ of 5 relaxed) =====
    const t2_conditions: TierCondition[] = [
      { id: 'vol_below_avg', label: 'Volume < 0.9x avg', met: volRatio < 0.9, value: `${ns(volRatio)}x` },
      { id: 'dxy_stable', label: 'DXY stable (|chg| < 0.5%)', met: Math.abs(dxyChange) < 0.5, value: `${ns(dxyChange)}%` },
      { id: 'vix_ok', label: 'VIX < 25', met: vixLevel < 25, value: `${ns(vixLevel)}` },
      { id: 'rsi_range', label: 'RSI 30-65', met: currentRSI >= 30 && currentRSI <= 65, value: `${ns(currentRSI)}` },
      { id: 'spx_stable', label: 'SPX not crashing (>-1.5%)', met: spxRet > -1.5, value: `${ns(spxRet)}%` },
    ];
    const t2_met = t2_conditions.filter(c => c.met).length;

    // ===== DETERMINE ACTIVE TIER =====
    let activeTier: 1 | 2 | 3;
    let activeConfig: TierConfig;
    let activeConditions: TierCondition[];
    let activeMet: number;
    let activeTotal: number;

    if (t1_met >= 6) {
      activeTier = 1;
      activeConfig = TIER1_CONFIG;
      activeConditions = t1_conditions;
      activeMet = t1_met;
      activeTotal = 7;
    } else if (t2_met >= 4) {
      activeTier = 2;
      activeConfig = TIER2_CONFIG;
      activeConditions = t2_conditions;
      activeMet = t2_met;
      activeTotal = 5;
    } else {
      activeTier = 3;
      activeConfig = TIER3_CONFIG;
      activeConditions = t2_conditions;
      activeMet = t2_met;
      activeTotal = 5;
    }

    const tierLabels: Record<number, string> = { 1: 'HIGH CONFIDENCE', 2: 'MEDIUM CONFIDENCE', 3: 'BASE (Every Friday)' };
    const tierColors: Record<number, string> = { 1: '#10b981', 2: '#06b6d4', 3: '#f59e0b' };

    const tpPrice = currentPrice * (1 + activeConfig.tp_pct / 100);
    const slPrice = currentPrice * (1 + activeConfig.sl_pct / 100);
    const tpDollar = position * activeConfig.tp_pct / 100;
    const slDollar = position * Math.abs(activeConfig.sl_pct) / 100;

    // Buy window: Friday 8PM-midnight Dubai (UTC 16:00-20:00)
    const buyWindowActive = isFriday && utcHour >= 16 && utcHour <= 23;
    const nextFridayNote = isFriday
      ? (dubaiHour >= 20 || dubaiHour < 1
          ? 'BUY WINDOW OPEN — Dubai evening entry zone'
          : `Buy window opens at 8:00 PM Dubai (in ~${(20 - dubaiHour + 24) % 24}h)`)
      : `Next trade: Friday 8:00 PM Dubai`;

    const result: TierResult = {
      tier: activeTier,
      tier_label: tierLabels[activeTier],
      color: tierColors[activeTier],
      signal: isFriday ? 'BUY' : 'WAIT',
      config: activeConfig,
      conditions: activeConditions,
      met_count: activeMet,
      total_count: activeTotal,
      trade_params: {
        entry_price: ns(currentPrice),
        tp_price: ns(tpPrice),
        sl_price: ns(slPrice),
        tp_dollar: Math.round(tpDollar),
        sl_dollar: Math.round(slDollar),
        hold_days: activeConfig.hold_days,
        position_size: position,
      },
      timing: {
        entry_dubai: 'Friday 8:00 PM - 12:00 AM',
        exit_dubai: `TP/SL hit or +${activeConfig.hold_days} day${activeConfig.hold_days > 1 ? 's' : ''} exit`,
        buy_window_active: buyWindowActive,
        window_note: nextFridayNote,
      },
    };

    return NextResponse.json({
      this_friday: result,
      all_tiers: {
        tier1: { config: TIER1_CONFIG, conditions: t1_conditions, met: t1_met, total: 7, threshold: 6 },
        tier2: { config: TIER2_CONFIG, conditions: t2_conditions, met: t2_met, total: 5, threshold: 4 },
        tier3: { config: TIER3_CONFIG, conditions: [], met: 0, total: 0, threshold: 0 },
      },
      combined_backtest: COMBINED_STATS,
      context: {
        price: ns(currentPrice),
        price_source: binance ? 'binance' : 'yahoo',
        rsi: ns(currentRSI),
        vol_ratio: ns(volRatio),
        vol_source: binance ? 'binance_hourly' : 'yahoo_daily',
        dxy_change: ns(dxyChange),
        vix: ns(vixLevel),
        spx_ret: ns(spxRet),
        weekly_ret: ns(weeklyRet),
        above_sma200: aboveSMA200,
        is_friday: isFriday,
        utc_day: utcDay,
        dubai_hour: dubaiHour,
      },
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
