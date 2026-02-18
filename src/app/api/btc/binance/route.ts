import { NextResponse } from 'next/server';

export const revalidate = 0; // no cache — always fresh

const BASE = 'https://api.binance.com';

interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  count: number;
}

interface BinanceDepthEntry {
  price: number;
  qty: number;
  total: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Binance API ${r.status}: ${r.statusText}`);
  return r.json() as Promise<T>;
}

export async function GET() {
  try {
    const [ticker, depth, klines] = await Promise.all([
      fetchJson<BinanceTicker>(`${BASE}/api/v3/ticker/24hr?symbol=BTCUSDT`),
      fetchJson<{ bids: string[][]; asks: string[][] }>(`${BASE}/api/v3/depth?symbol=BTCUSDT&limit=10`),
      fetchJson<unknown[][]>(`${BASE}/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24`),
    ]);

    const price = parseFloat(ticker.lastPrice);
    const open24h = parseFloat(ticker.openPrice);
    const high24h = parseFloat(ticker.highPrice);
    const low24h = parseFloat(ticker.lowPrice);
    const volume24h = parseFloat(ticker.volume);
    const quoteVolume24h = parseFloat(ticker.quoteVolume);
    const changePct = parseFloat(ticker.priceChangePercent);
    const trades24h = ticker.count;

    // Order book: top 10 bids and asks with cumulative totals
    const parseSide = (entries: string[][]): BinanceDepthEntry[] => {
      let cumulative = 0;
      return entries.map(([p, q]) => {
        const qty = parseFloat(q);
        cumulative += qty;
        return { price: parseFloat(p), qty, total: Math.round(cumulative * 1000) / 1000 };
      });
    };
    const bids = parseSide(depth.bids);
    const asks = parseSide(depth.asks);

    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const spread = bestAsk - bestBid;
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    // Bid/ask wall detection: largest single order in top 10
    const bidWall = bids.reduce((max, b) => b.qty > max.qty ? b : max, bids[0]);
    const askWall = asks.reduce((max, a) => a.qty > max.qty ? a : max, asks[0]);

    // Total depth (liquidity within top 10 levels)
    const totalBidQty = bids.reduce((s, b) => s + b.qty, 0);
    const totalAskQty = asks.reduce((s, a) => s + a.qty, 0);
    const bidAskRatio = totalAskQty > 0 ? totalBidQty / totalAskQty : 0;

    // Hourly volume from klines (last 24 1h candles)
    const hourlyVolumes = klines.map((k: unknown[]) => ({
      time: new Date(k[0] as number).toISOString(),
      volume: parseFloat(k[5] as string),
      quoteVolume: parseFloat(k[7] as string),
      close: parseFloat(k[4] as string),
      trades: k[8] as number,
    }));

    // Average hourly volume
    const avgHourlyVol = hourlyVolumes.reduce((s: number, h: { volume: number }) => s + h.volume, 0) / hourlyVolumes.length;
    const currentHourVol = hourlyVolumes[hourlyVolumes.length - 1]?.volume ?? 0;
    const volRatio = avgHourlyVol > 0 ? currentHourVol / avgHourlyVol : 0;

    return NextResponse.json({
      source: 'binance',
      symbol: 'BTCUSDT',
      price,
      open_24h: open24h,
      high_24h: high24h,
      low_24h: low24h,
      change_pct: Math.round(changePct * 100) / 100,
      volume_24h_btc: Math.round(volume24h * 100) / 100,
      volume_24h_usdt: Math.round(quoteVolume24h),
      trades_24h: trades24h,
      spread: {
        value: Math.round(spread * 100) / 100,
        pct: Math.round(spreadPct * 10000) / 10000,
        best_bid: bestBid,
        best_ask: bestAsk,
      },
      order_book: {
        bids: bids.map((b) => ({ ...b, usd: Math.round(b.qty * b.price) })),
        asks: asks.map((a) => ({ ...a, usd: Math.round(a.qty * a.price) })),
        bid_wall: { price: bidWall.price, qty: bidWall.qty, usd: Math.round(bidWall.qty * bidWall.price) },
        ask_wall: { price: askWall.price, qty: askWall.qty, usd: Math.round(askWall.qty * askWall.price) },
        bid_depth_btc: Math.round(totalBidQty * 1000) / 1000,
        ask_depth_btc: Math.round(totalAskQty * 1000) / 1000,
        bid_ask_ratio: Math.round(bidAskRatio * 100) / 100,
        pressure: bidAskRatio > 1.2 ? 'BUY_PRESSURE' : bidAskRatio < 0.8 ? 'SELL_PRESSURE' : 'NEUTRAL',
      },
      volume_profile: {
        avg_hourly_btc: Math.round(avgHourlyVol * 100) / 100,
        current_hour_btc: Math.round(currentHourVol * 100) / 100,
        vol_ratio: Math.round(volRatio * 100) / 100,
        is_low_volume: volRatio < 0.7,
      },
      updated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
