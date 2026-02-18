const FRED_API_KEY = '2a948cee2bd38aff557c01946bfc5110';

interface YFCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ---------------------------------------------------------------------------
// Yahoo Finance v8 chart API (public, no key needed)
// ---------------------------------------------------------------------------

async function yfChart(
  symbol: string,
  range: string,
  interval: string
): Promise<YFCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`YF ${symbol}: ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`YF ${symbol}: no data`);

  const ts = result.timestamp as number[];
  const q = result.indicators.quote[0];
  const candles: YFCandle[] = [];
  for (let i = 0; i < ts.length; i++) {
    if (q.close[i] == null) continue;
    candles.push({
      date: new Date(ts[i] * 1000).toISOString(),
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      volume: q.volume[i] ?? 0,
    });
  }
  return candles;
}

// ---------------------------------------------------------------------------
// Technical indicators
// ---------------------------------------------------------------------------

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d;
    else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function ema(data: number[], span: number): number[] {
  const k = 2 / (span + 1);
  const out: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    out.push(data[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function sma(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    out.push(sum / period);
  }
  return out;
}

function calcMACD(closes: number[]) {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signal[i]);
  return { macdLine, signal, histogram };
}

function calcBollinger(closes: number[], period = 20, stdDev = 2) {
  const mid = sma(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (mid[i] == null) { upper.push(null); lower.push(null); continue; }
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - mid[i]!) ** 2;
    const std = Math.sqrt(variance / period);
    upper.push(mid[i]! + stdDev * std);
    lower.push(mid[i]! - stdDev * std);
  }
  return { upper, mid, lower };
}

// ---------------------------------------------------------------------------
// FRED
// ---------------------------------------------------------------------------

async function fredSeries(seriesId: string, start: string): Promise<{ date: string; value: number }[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_start=${start}&api_key=${FRED_API_KEY}&file_type=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`);
  const json = await res.json();
  return (json.observations ?? [])
    .filter((o: { value: string }) => o.value !== '.')
    .map((o: { date: string; value: string }) => ({
      date: o.date,
      value: parseFloat(o.value),
    }));
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  yfChart,
  calcRSI,
  calcMACD,
  calcBollinger,
  ema,
  sma,
  fredSeries,
};
export type { YFCandle };
