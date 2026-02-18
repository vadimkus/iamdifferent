import { NextResponse } from 'next/server';
import { yfChart, calcRSI, ema, sma } from '@/lib/btc-data';

export const revalidate = 300;

function ns(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

// Yahoo Finance supported intervals and their max range
const INTERVAL_MAX_RANGE: Record<string, string> = {
  '1h': '730d',
  '1d': '10y',
};

// Map user-facing intervals to yf intervals + aggregation factor
function resolveInterval(interval: string): { yfInterval: string; aggregation: number } {
  switch (interval) {
    case '1h': return { yfInterval: '1h', aggregation: 1 };
    case '2h': return { yfInterval: '1h', aggregation: 2 };
    case '4h': return { yfInterval: '1h', aggregation: 4 };
    case '1d': return { yfInterval: '1d', aggregation: 1 };
    default: return { yfInterval: '1d', aggregation: 1 };
  }
}

// Best range for each interval to get enough data
function bestRange(interval: string, requestedRange?: string): string {
  if (requestedRange) return requestedRange;
  switch (interval) {
    case '1h': return '30d';
    case '2h': return '60d';
    case '4h': return '90d';
    case '1d': return '1y';
    default: return '6mo';
  }
}

interface AggCandle {
  date: string; open: number; high: number; low: number; close: number; volume: number;
}

function aggregateCandles(candles: AggCandle[], factor: number): AggCandle[] {
  if (factor <= 1) return candles;
  const result: AggCandle[] = [];
  for (let i = 0; i < candles.length; i += factor) {
    const group = candles.slice(i, i + factor);
    if (group.length === 0) continue;
    result.push({
      date: group[0].date,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, c) => s + c.volume, 0),
    });
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '1d';
    const range = searchParams.get('range') || bestRange(interval);

    const { yfInterval, aggregation } = resolveInterval(interval);
    const maxRange = INTERVAL_MAX_RANGE[yfInterval] || '10y';
    const effectiveRange = rangeToMs(range) > rangeToMs(maxRange) ? maxRange : range;

    const rawCandles = await yfChart('BTC-USD', effectiveRange, yfInterval);
    const candles = aggregateCandles(rawCandles, aggregation);
    const closes = candles.map((c) => c.close);

    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const sma200 = sma(closes, 200);
    const rsiArr = calcRSI(closes);

    const dateSliceLen = yfInterval === '1h' ? 16 : 10;
    const data = candles.map((c, i) => ({
      date: c.date.slice(0, dateSliceLen),
      open: ns(c.open),
      high: ns(c.high),
      low: ns(c.low),
      close: ns(c.close),
      volume: c.volume,
      ema_20: ns(ema20[i]),
      ema_50: ns(ema50[i]),
      sma_200: ns(sma200[i]),
      rsi: ns(rsiArr[i]),
    }));

    return NextResponse.json({ interval, range: effectiveRange, candles: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function rangeToMs(range: string): number {
  const n = parseInt(range);
  if (range.endsWith('d')) return n * 86400_000;
  if (range.endsWith('mo')) return n * 30 * 86400_000;
  if (range.endsWith('y')) return n * 365 * 86400_000;
  return 365 * 86400_000;
}
