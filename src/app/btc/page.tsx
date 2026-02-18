'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Script from 'next/script';

// ---------- types ----------
interface SpxData {
  price: number; change_pct: number; rsi_14: number;
  ema_20: number; ema_50: number; sma_50: number | null; sma_200: number | null;
  macd: number; macd_signal: number; macd_hist: number;
  high_52w: number; low_52w: number; from_high_pct: number;
  range_5d: { high: number; low: number }; range_20d: { high: number; low: number };
}
interface VixData {
  price: number; change_pct: number; sma_20: number | null; above_sma20: boolean;
  high_6m: number; low_6m: number; zone: string;
  range_5d: { high: number; low: number }; range_20d: { high: number; low: number };
}
interface LiveData {
  price: number; change_pct: number; rsi_14: number;
  macd: number; macd_signal: number; macd_hist: number;
  bb_upper: number; bb_mid: number; bb_lower: number;
  ema_20: number; ema_50: number; sma_200: number | null;
  spx: SpxData; vix: VixData;
}
interface MacroData {
  m2_latest: number; m2_change_mom: number; m2_yoy_pct: number;
  m2_history: { date: string; value: number }[];
  fed_balance_sheet: number; fed_funds_rate: number; yield_curve_10y2y: number;
}
interface DxyData { dxy: number; change_pct: number }
interface ChartCandle {
  date: string; open: number; high: number; low: number; close: number;
  volume: number; ema_20: number; ema_50: number; sma_200: number | null; rsi: number | null;
}
interface ChartData { interval: string; range: string; candles: ChartCandle[] }
interface CalEvent {
  date: string; type: string; label: string; color: string; icon: string;
}
interface EventsData { events: CalEvent[]; count: number }
interface CorrData {
  matrix: { btc_spx: number; btc_gold: number; spx_gold: number };
  rolling_30d: { date: string; btc_spx: number | null; btc_gold: number | null }[];
}
interface BinanceSpread { value: number; pct: number; best_bid: number; best_ask: number }
interface BinanceOrderBook {
  bids: { price: number; qty: number; total: number; usd: number }[];
  asks: { price: number; qty: number; total: number; usd: number }[];
  bid_wall: { price: number; qty: number; usd: number };
  ask_wall: { price: number; qty: number; usd: number };
  bid_depth_btc: number; ask_depth_btc: number;
  bid_ask_ratio: number; pressure: string;
}
interface BinanceVolProfile { avg_hourly_btc: number; current_hour_btc: number; vol_ratio: number; is_low_volume: boolean }
interface BinanceData {
  price: number; change_pct: number; open_24h: number; high_24h: number; low_24h: number;
  volume_24h_btc: number; volume_24h_usdt: number; trades_24h: number;
  spread: BinanceSpread; order_book: BinanceOrderBook; volume_profile: BinanceVolProfile;
}
interface AlphaCond { id: string; label: string; met: boolean; value: string }
interface AlphaBacktest {
  win_rate: number; trades: number; expectancy: number; sharpe: number;
  max_drawdown: number; cum_return: number; target_pct: number; stop_pct: number; hold_days: number;
}
interface AlphaTiming {
  entry_dubai: string; entry_utc: string; entry_ny: string;
  exit_dubai: string; exit_utc: string; exit_ny: string;
  buy_window_active: boolean; window_note: string;
}
interface AlphaSetup {
  id: string; name: string; description: string; signal: string; confidence: number;
  conditions: AlphaCond[]; met_count: number; total_count: number;
  timing: AlphaTiming; backtest: AlphaBacktest;
}
interface AlphaData {
  overall_signal: string; best_setup: string; best_confidence: number;
  setups: AlphaSetup[]; context: Record<string, unknown>; updated: string;
}

interface WeeklyTierCond { id: string; label: string; met: boolean; value: string }
interface WeeklyTierConfig {
  tp_pct: number; sl_pct: number; hold_days: number; win_rate: number;
  trades: number; trades_per_year: number; expectancy: number; sharpe: number;
  max_drawdown: number; cum_return: number;
}
interface WeeklyTierInfo { config: WeeklyTierConfig; conditions: WeeklyTierCond[]; met: number; total: number; threshold: number }
interface WeeklyThisFriday {
  tier: number; tier_label: string; color: string; signal: string;
  config: WeeklyTierConfig; conditions: WeeklyTierCond[]; met_count: number; total_count: number;
  trade_params: {
    entry_price: number | null; tp_price: number | null; sl_price: number | null;
    tp_dollar: number | null; sl_dollar: number | null; hold_days: number; position_size: number;
  };
  timing: { entry_dubai: string; exit_dubai: string; buy_window_active: boolean; window_note: string };
}
interface WeeklyCombined {
  total_trades: number; trades_per_year: number; win_rate: number; expectancy: number;
  cum_return: number; max_drawdown: number; sharpe: number;
  projection_270k: { annual_trades: number; annual_pnl: number; annual_roi_pct: number };
}
interface WeeklyStrategyData {
  this_friday: WeeklyThisFriday;
  all_tiers: { tier1: WeeklyTierInfo; tier2: WeeklyTierInfo; tier3: WeeklyTierInfo };
  combined_backtest: WeeklyCombined;
  context: Record<string, unknown>;
  updated: string;
}

interface FridayHourStat {
  entry_hour_utc: number; entry_hour_dubai: number; entry_hour_et: number;
  trades: number; tp_hit_rate: number; sl_hit_rate: number; neither_rate: number;
  sat_4am_utc_wr: number | null; sat_4am_utc_avg: number | null;
  score: number;
}
interface FridayMonthlyStat {
  month: string; month_num: number; fridays: number;
  avg_return_1d: number; win_rate_1d: number; avg_return_2d: number; win_rate_2d: number;
}
interface FridayCrossCell {
  month: string; month_num: number; entry_hour_utc: number; entry_hour_dubai: number;
  trades: number; win_rate: number; avg_return: number;
}
interface FridayTimingData {
  best_entry: { hour_dubai: number; hour_utc: number; hour_et: number; tp_hit_rate: number; win_rate_sat_8am: number; avg_return: number };
  ranked_entry_hours: FridayHourStat[];
  monthly_friday_stats: FridayMonthlyStat[];
  month_hour_cross_table: FridayCrossCell[];
  yearly_friday_stats: { year: number; fridays: number; avg_return: number; win_rate: number }[];
}

declare const Chart: any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ---------- helpers ----------
const fmt = (n: number | null | undefined) => n == null ? '--' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const pctSign = (v: number | null | undefined) => v == null ? '--' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const pctCol = (v: number | null | undefined) => (!v || v >= 0) ? '#22c55e' : '#ef4444';

function clockStr(tz: string) {
  return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour12: false });
}

// ---------- component ----------
export default function BTCPage() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [dxy, setDxy] = useState<DxyData | null>(null);
  const [corr, setCorr] = useState<CorrData | null>(null);
  const [alpha, setAlpha] = useState<AlphaData | null>(null);
  const [binance, setBinance] = useState<BinanceData | null>(null);
  const [fridayTiming, setFridayTiming] = useState<FridayTimingData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStrategyData | null>(null);
  const [btcChart, setBtcChart] = useState<ChartData | null>(null);
  const [btcChartInterval, setBtcChartInterval] = useState('1d');
  const [btcChartRange, setBtcChartRange] = useState('6mo');
  const [chartEvents, setChartEvents] = useState<CalEvent[]>([]);
  const [eventsVisible, setEventsVisible] = useState({ full_moon: true, new_moon: false, lunar_eclipse: true, solar_eclipse: true, fomc: true, earnings: true });
  const [clocks, setClocks] = useState({ dubai: '--:--:--', ny: '--:--:--', utc: '--:--:--' });
  const [chartReady, setChartReady] = useState(false);

  const m2ChartRef = useRef<HTMLCanvasElement>(null);
  const corrChartRef = useRef<HTMLCanvasElement>(null);
  const btcPriceChartRef = useRef<HTMLCanvasElement>(null);
  const btcVolChartRef = useRef<HTMLCanvasElement>(null);
  const btcRsiChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Clocks
  useEffect(() => {
    const id = setInterval(() => {
      setClocks({ dubai: clockStr('Asia/Dubai'), ny: clockStr('America/New_York'), utc: clockStr('UTC') });
    }, 1000);
    setClocks({ dubai: clockStr('Asia/Dubai'), ny: clockStr('America/New_York'), utc: clockStr('UTC') });
    return () => clearInterval(id);
  }, []);

  // Data fetchers
  const loadLive = useCallback(async () => {
    try { const r = await fetch('/api/btc/live'); setLive(await r.json()); } catch { /* retry next cycle */ }
  }, []);
  const loadMacro = useCallback(async () => {
    try { const r = await fetch('/api/btc/macro'); setMacro(await r.json()); } catch { /* */ }
  }, []);
  const loadDxy = useCallback(async () => {
    try { const r = await fetch('/api/btc/dxy'); setDxy(await r.json()); } catch { /* */ }
  }, []);
  const loadCorr = useCallback(async () => {
    try { const r = await fetch('/api/btc/correlations'); setCorr(await r.json()); } catch { /* */ }
  }, []);
  const loadAlpha = useCallback(async () => {
    try { const r = await fetch('/api/btc/alpha-strategy'); setAlpha(await r.json()); } catch { /* */ }
  }, []);
  const loadBinance = useCallback(async () => {
    try {
      const r = await fetch('/api/btc/binance');
      const d = await r.json();
      if (d && d.price && !d.error) setBinance(d);
    } catch { /* Binance unavailable — dashboard works without it */ }
  }, []);
  const loadFridayTiming = useCallback(async () => {
    try { const r = await fetch('/api/btc/friday-timing'); setFridayTiming(await r.json()); } catch { /* */ }
  }, []);
  const loadWeekly = useCallback(async () => {
    try { const r = await fetch('/api/btc/weekly-strategy'); const d = await r.json(); if (d && !d.error) setWeekly(d); } catch { /* */ }
  }, []);
  const loadBtcChart = useCallback(async (interval: string, range: string) => {
    try { const r = await fetch(`/api/btc/chart?interval=${interval}&range=${range}`); setBtcChart(await r.json()); } catch { /* */ }
  }, []);
  const loadEvents = useCallback(async () => {
    try { const r = await fetch('/api/btc/events?from=2024-01-01&to=2027-01-01'); const d: EventsData = await r.json(); setChartEvents(d.events); } catch { /* */ }
  }, []);

  useEffect(() => {
    loadLive(); loadMacro(); loadDxy(); loadCorr(); loadAlpha(); loadBinance(); loadFridayTiming(); loadWeekly(); loadBtcChart(btcChartInterval, btcChartRange); loadEvents();
    const id1 = setInterval(() => { loadLive(); loadAlpha(); loadWeekly(); }, 60_000);
    const id2 = setInterval(() => { loadBinance(); }, 10_000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [loadLive, loadMacro, loadDxy, loadCorr, loadAlpha, loadBinance, loadFridayTiming, loadWeekly, loadBtcChart, btcChartInterval, btcChartRange, loadEvents]);

  // Charts (after Chart.js loads)
  useEffect(() => {
    if (!chartReady) return;
    chartInstances.current.forEach((c) => c?.destroy());
    chartInstances.current = [];

    const chartOpts = (yLabel?: string) => ({
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#64748b', maxTicksLimit: 8 }, grid: { color: 'rgba(30,41,59,.5)' } },
        y: { ticks: { color: '#64748b', ...(yLabel ? { callback: (v: number) => yLabel + v.toLocaleString() } : {}) }, grid: { color: 'rgba(30,41,59,.5)' } },
      },
      plugins: { legend: { labels: { color: '#94a3b8' } } },
    });

    // BTC Price Chart with event overlays
    if (btcChart?.candles && btcPriceChartRef.current) {
      const c = btcChart.candles;
      const step = c.length > 300 ? Math.floor(c.length / 300) : 1;
      const sampled = c.filter((_: ChartCandle, i: number) => i % step === 0 || i === c.length - 1);
      const labels = sampled.map((d: ChartCandle) => d.date);

      // Map visible events to chart label indices
      const visibleEvents = chartEvents.filter((e) => eventsVisible[e.type as keyof typeof eventsVisible]);
      const eventIndices: { idx: number; ev: CalEvent }[] = [];
      for (const ev of visibleEvents) {
        const datePrefix = ev.date.slice(0, 10);
        const idx = labels.findIndex((l) => l.startsWith(datePrefix));
        if (idx !== -1) eventIndices.push({ idx, ev });
      }

      chartInstances.current.push(new Chart(btcPriceChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'BTC Close', data: sampled.map((d: ChartCandle) => d.close), borderColor: '#e2e8f0', backgroundColor: 'rgba(226,232,240,.05)', fill: true, tension: .2, pointRadius: 0, borderWidth: 2, order: 2 },
            { label: 'EMA 20', data: sampled.map((d: ChartCandle) => d.ema_20), borderColor: '#3b82f6', borderWidth: 1.5, pointRadius: 0, borderDash: [4, 2], tension: .2, order: 3 },
            { label: 'EMA 50', data: sampled.map((d: ChartCandle) => d.ema_50), borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 0, borderDash: [4, 2], tension: .2, order: 3 },
            { label: 'SMA 200', data: sampled.map((d: ChartCandle) => d.sma_200), borderColor: '#a855f7', borderWidth: 1.5, pointRadius: 0, borderDash: [6, 3], tension: .2, order: 3 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { ticks: { color: '#64748b', maxTicksLimit: 10, maxRotation: 0 }, grid: { color: 'rgba(30,41,59,.3)' } },
            y: { position: 'right', ticks: { color: '#64748b', callback: (v: number) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }, grid: { color: 'rgba(30,41,59,.3)' } },
          },
          plugins: {
            legend: { labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'line', boxWidth: 20 } },
            tooltip: {
              callbacks: {
                afterBody: (ctx: { dataIndex: number }[]) => {
                  if (!ctx.length) return '';
                  const di = ctx[0].dataIndex;
                  const matchingEvents = eventIndices.filter((e) => e.idx === di);
                  if (matchingEvents.length === 0) return '';
                  return matchingEvents.map((e) => `${e.ev.icon} ${e.ev.label}`).join('\n');
                },
              },
            },
          },
        },
        plugins: [{
          id: 'eventMarkers',
          afterDraw(chart: { ctx: CanvasRenderingContext2D; scales: { x: { getPixelForValue: (v: number) => number }; y: { top: number; bottom: number } }; chartArea: { top: number; bottom: number } }) {
            const { ctx } = chart;
            const xScale = chart.scales.x;
            const { top, bottom } = chart.chartArea;
            ctx.save();

            for (const { idx, ev } of eventIndices) {
              const x = xScale.getPixelForValue(idx);
              ctx.strokeStyle = ev.color;
              ctx.globalAlpha = 0.5;
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(x, top);
              ctx.lineTo(x, bottom);
              ctx.stroke();

              ctx.globalAlpha = 1;
              ctx.setLineDash([]);
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(ev.icon, x, top - 4);
            }
            ctx.restore();
          },
        }],
      }));
    }

    // BTC Volume Chart
    if (btcChart?.candles && btcVolChartRef.current) {
      const c = btcChart.candles;
      const step = c.length > 200 ? Math.floor(c.length / 200) : 1;
      const sampled = c.filter((_: ChartCandle, i: number) => i % step === 0 || i === c.length - 1);
      const labels = sampled.map((d: ChartCandle) => d.date);
      const colors = sampled.map((d: ChartCandle) => d.close >= d.open ? 'rgba(34,197,94,.6)' : 'rgba(239,68,68,.6)');

      chartInstances.current.push(new Chart(btcVolChartRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Volume', data: sampled.map((d: ChartCandle) => d.volume), backgroundColor: colors, borderWidth: 0 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { display: false },
            y: { position: 'right', ticks: { color: '#64748b', callback: (v: number) => (v / 1e9).toFixed(0) + 'B' }, grid: { color: 'rgba(30,41,59,.3)' } },
          },
          plugins: { legend: { display: false } },
        },
      }));
    }

    // BTC RSI Chart
    if (btcChart?.candles && btcRsiChartRef.current) {
      const c = btcChart.candles;
      const step = c.length > 200 ? Math.floor(c.length / 200) : 1;
      const sampled = c.filter((_: ChartCandle, i: number) => i % step === 0 || i === c.length - 1);
      const labels = sampled.map((d: ChartCandle) => d.date);

      chartInstances.current.push(new Chart(btcRsiChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'RSI 14', data: sampled.map((d: ChartCandle) => d.rsi), borderColor: '#06b6d4', borderWidth: 1.5, pointRadius: 0, tension: .3, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { display: false },
            y: { position: 'right', min: 0, max: 100, ticks: { color: '#64748b', stepSize: 20 }, grid: { color: 'rgba(30,41,59,.3)' } },
          },
          plugins: {
            legend: { display: false },
            annotation: undefined,
          },
        },
        plugins: [{
          id: 'rsiZones',
          beforeDraw(chart: { ctx: CanvasRenderingContext2D; scales: { y: { getPixelForValue: (v: number) => number }; x: { left: number; right: number } } }) {
            const { ctx } = chart;
            const yScale = chart.scales.y;
            const xScale = chart.scales.x;
            ctx.save();
            // Overbought zone (70-100)
            ctx.fillStyle = 'rgba(239,68,68,.08)';
            ctx.fillRect(xScale.left, yScale.getPixelForValue(100), xScale.right - xScale.left, yScale.getPixelForValue(70) - yScale.getPixelForValue(100));
            // Oversold zone (0-30)
            ctx.fillStyle = 'rgba(34,197,94,.08)';
            ctx.fillRect(xScale.left, yScale.getPixelForValue(30), xScale.right - xScale.left, yScale.getPixelForValue(0) - yScale.getPixelForValue(30));
            // Lines at 30 and 70
            ctx.strokeStyle = 'rgba(148,163,184,.3)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(xScale.left, yScale.getPixelForValue(70));
            ctx.lineTo(xScale.right, yScale.getPixelForValue(70));
            ctx.moveTo(xScale.left, yScale.getPixelForValue(30));
            ctx.lineTo(xScale.right, yScale.getPixelForValue(30));
            ctx.stroke();
            ctx.restore();
          }
        }],
      }));
    }

    if (macro?.m2_history && m2ChartRef.current) {
      const m2 = macro.m2_history.filter((_: { date: string; value: number }, i: number) => i % 6 === 0);
      chartInstances.current.push(new Chart(m2ChartRef.current, {
        type: 'line',
        data: {
          labels: m2.map((h: { date: string; value: number }) => h.date.substring(0, 7)),
          datasets: [{ label: 'M2 ($B)', data: m2.map((h: { date: string; value: number }) => h.value), borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,.1)', fill: true, tension: .3, pointRadius: 0 }],
        },
        options: { ...chartOpts(), plugins: { legend: { display: false } } },
      }));
    }

    if (corr?.rolling_30d && corrChartRef.current) {
      const c = corr.rolling_30d.filter((_: { date: string; btc_spx: number | null; btc_gold: number | null }, i: number) => i % 5 === 0);
      chartInstances.current.push(new Chart(corrChartRef.current, {
        type: 'line',
        data: {
          labels: c.map((d: { date: string }) => d.date),
          datasets: [
            { label: 'BTC-SPX', data: c.map((d: { btc_spx: number | null }) => d.btc_spx), borderColor: '#3b82f6', tension: .3, pointRadius: 0 },
            { label: 'BTC-Gold', data: c.map((d: { btc_gold: number | null }) => d.btc_gold), borderColor: '#f59e0b', tension: .3, pointRadius: 0 },
          ],
        },
        options: { ...chartOpts(), scales: { ...chartOpts().scales, y: { ...chartOpts().scales.y, min: -1, max: 1 } } },
      }));
    }
  }, [chartReady, macro, corr, btcChart, chartEvents, eventsVisible]);

  // Signal logic

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
        onLoad={() => setChartReady(true)}
      />
      <style jsx global>{`
        :root { --bg:#0a0e17;--card:#111827;--border:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--green:#22c55e;--red:#ef4444;--blue:#3b82f6;--amber:#f59e0b;--purple:#a855f7;--cyan:#06b6d4; }
        body { background: var(--bg) !important; color: var(--text); }
        .btc-header { background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%); border-bottom:1px solid var(--border); padding:20px 32px; display:flex; justify-content:space-between; align-items:center; }
        .btc-header h1 { font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--text); }
        .btc-header h1 span { color:var(--amber); }
        .clocks { display:flex; gap:24px; font-size:13px; color:var(--muted); }
        .clocks .tv { font-size:18px; font-weight:600; color:var(--text); font-variant-numeric:tabular-nums; }
        .btc-container { max-width:1440px; margin:0 auto; padding:24px; }
        .grid-top { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
        .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; }
        .card-title { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:8px; }
        .card-value { font-size:32px; font-weight:700; font-variant-numeric:tabular-nums; }
        .card-sub { font-size:14px; margin-top:4px; }
        .sec-title { font-size:18px; font-weight:600; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
        .mr { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(30,41,59,.5); }
        .mr:last-child { border-bottom:none; }
        .mr-l { color:var(--muted); font-size:13px; }
        .mr-v { font-weight:600; font-variant-numeric:tabular-nums; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { text-align:left; color:var(--muted); font-weight:500; padding:8px 12px; border-bottom:1px solid var(--border); font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
        td { padding:8px 12px; border-bottom:1px solid rgba(30,41,59,.5); font-variant-numeric:tabular-nums; }
        .chart-wrap { position:relative; height:280px; }
        .bar-w { display:flex; align-items:center; gap:6px; }
        .bar { height:6px; border-radius:3px; min-width:2px; }
        .loading { color:var(--muted); padding:40px; text-align:center; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        @media(max-width:1100px) { .alpha-grid { grid-template-columns:1fr !important; } }
        @media(max-width:900px) { .grid-top { grid-template-columns:repeat(2,1fr); } .grid-2 { grid-template-columns:1fr; } }
      `}</style>

      <div className="btc-header">
        <h1>BTC <span>Dubai Session</span> Trader</h1>
        <div className="clocks">
          <div><div>Dubai (GST)</div><div className="tv">{clocks.dubai}</div></div>
          <div><div>New York (ET)</div><div className="tv">{clocks.ny}</div></div>
          <div><div>UTC</div><div className="tv">{clocks.utc}</div></div>
        </div>
      </div>

      <div className="btc-container">
        {/* Alpha Strategy Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="sec-title" style={{ marginBottom: 0 }}><span className="dot" style={{ background: '#fbbf24' }} /> Alpha Strategies (Backtested 80%+ Win Rate)</div>
            {alpha && (
              <div style={{
                padding: '6px 18px', borderRadius: 24, fontWeight: 700, fontSize: 16,
                background: alpha.overall_signal === 'BUY' ? 'rgba(34,197,94,.2)' : 'rgba(148,163,184,.1)',
                color: alpha.overall_signal === 'BUY' ? 'var(--green)' : 'var(--muted)',
                border: `2px solid ${alpha.overall_signal === 'BUY' ? 'rgba(34,197,94,.4)' : 'rgba(148,163,184,.2)'}`,
              }}>{alpha.overall_signal === 'BUY' ? 'SIGNAL ACTIVE' : 'NO SIGNAL'}</div>
            )}
          </div>
          {alpha ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {alpha.setups.map((s: AlphaSetup) => {
                const isBuy = s.signal === 'BUY';
                const b = s.backtest;
                const borderColor = isBuy ? 'rgba(34,197,94,.6)' : 'var(--border)';
                const glowBg = isBuy ? 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(6,182,212,.05))' : undefined;
                return (
                  <div key={s.id} className="card" style={{ border: `2px solid ${borderColor}`, background: glowBg || 'var(--card)', position: 'relative', overflow: 'hidden' }}>
                    {isBuy && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: isBuy ? 'var(--green)' : 'var(--text)' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.description}</div>
                      </div>
                      <div style={{
                        padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700,
                        background: isBuy ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.1)',
                        color: isBuy ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${isBuy ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)'}`,
                        whiteSpace: 'nowrap',
                      }}>{s.signal}</div>
                    </div>

                    {/* Backtest stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, padding: 10, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: b.win_rate >= 80 ? 'var(--green)' : 'var(--cyan)' }}>{b.win_rate}%</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>WIN RATE</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{b.trades}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>TRADES</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>{b.sharpe}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>SHARPE</div>
                      </div>
                    </div>

                    {/* Risk params */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 11, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(34,197,94,.15)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>TP: +{b.target_pct}%</span>
                      <span style={{ background: 'rgba(239,68,68,.15)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>SL: {b.stop_pct}%</span>
                      <span style={{ background: 'rgba(148,163,184,.1)', color: 'var(--muted)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Hold: {b.hold_days}d</span>
                      <span style={{ background: 'rgba(168,85,247,.1)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Exp: +{b.expectancy}%</span>
                    </div>

                    {/* Trade Timing */}
                    <div style={{
                      marginBottom: 12, padding: 10, borderRadius: 8, fontSize: 11,
                      background: s.timing.buy_window_active
                        ? 'linear-gradient(135deg, rgba(34,197,94,.15), rgba(6,182,212,.1))'
                        : 'rgba(30,41,59,.4)',
                      border: s.timing.buy_window_active ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(30,41,59,.5)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: s.timing.buy_window_active ? 'var(--green)' : 'var(--text)', fontSize: 12 }}>
                          {s.timing.buy_window_active ? 'BUY WINDOW OPEN' : 'Trade Timing'}
                        </span>
                        {s.timing.buy_window_active && (
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
                            boxShadow: '0 0 6px var(--green)', display: 'inline-block',
                            animation: 'pulse 1.5s infinite',
                          }} />
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: 'var(--muted)' }}>
                        <div>Entry (Dubai): <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{s.timing.entry_dubai}</span></div>
                        <div>Exit (Dubai): <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{s.timing.exit_dubai}</span></div>
                        <div>Entry (UTC): <span style={{ color: 'var(--text)' }}>{s.timing.entry_utc}</span></div>
                        <div>Exit (UTC): <span style={{ color: 'var(--text)' }}>{s.timing.exit_utc}</span></div>
                        <div>Entry (NY): <span style={{ color: 'var(--text)' }}>{s.timing.entry_ny}</span></div>
                        <div>Exit (NY): <span style={{ color: 'var(--text)' }}>{s.timing.exit_ny}</span></div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, color: s.timing.buy_window_active ? 'var(--green)' : 'var(--muted)', fontStyle: 'italic' }}>
                        {s.timing.window_note}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                        Conditions: {s.met_count}/{s.total_count}
                      </div>
                      {s.conditions.map((c: AlphaCond) => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(30,41,59,.3)' }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700,
                            background: c.met ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.1)',
                            color: c.met ? 'var(--green)' : 'var(--red)',
                          }}>{c.met ? '\u2713' : '\u2717'}</span>
                          <span style={{ flex: 1, color: c.met ? 'var(--text)' : 'var(--muted)' }}>{c.label}</span>
                          <span style={{ color: c.met ? 'var(--green)' : 'var(--muted)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{c.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Confidence bar */}
                    {s.confidence > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                          <span>Confidence</span><span>{s.confidence}%</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: 'rgba(30,41,59,.8)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.confidence}%`, background: s.confidence >= 80 ? 'var(--green)' : s.confidence >= 50 ? 'var(--cyan)' : 'var(--amber)', borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <div className="loading">Loading alpha strategies...</div>}
        </div>

        {/* Weekly Friday Strategy — This Friday's Trade */}
        {weekly && (() => {
          const f = weekly.this_friday;
          const cb = weekly.combined_backtest;
          const tp = f.trade_params;
          const tierColors: Record<number, string> = { 1: '#10b981', 2: '#06b6d4', 3: '#f59e0b' };
          const tierBg: Record<number, string> = { 1: 'rgba(16,185,129,.08)', 2: 'rgba(6,182,212,.06)', 3: 'rgba(245,158,11,.06)' };
          const isBuy = f.signal === 'BUY';
          return (
            <div className="card" style={{ marginBottom: 24, border: `2px solid ${isBuy ? tierColors[f.tier] : 'var(--border)'}`, background: isBuy ? tierBg[f.tier] : undefined }}>
              {isBuy && <div style={{ height: 3, background: `linear-gradient(90deg, ${tierColors[f.tier]}, ${tierColors[f.tier]}88)`, marginBottom: 8, borderRadius: 2 }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <div className="sec-title" style={{ marginBottom: 0 }}>
                  <span className="dot" style={{ background: tierColors[f.tier] }} />
                  This Friday&apos;s Trade — Weekly Strategy
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 14px', borderRadius: 16, fontSize: 12, fontWeight: 800,
                    background: `${tierColors[f.tier]}22`, color: tierColors[f.tier], border: `1px solid ${tierColors[f.tier]}44`,
                  }}>TIER {f.tier} — {f.tier_label}</span>
                  <span style={{
                    padding: '4px 14px', borderRadius: 16, fontSize: 12, fontWeight: 800,
                    background: isBuy ? 'rgba(34,197,94,.2)' : 'rgba(148,163,184,.1)',
                    color: isBuy ? 'var(--green)' : 'var(--muted)',
                    border: `1px solid ${isBuy ? 'rgba(34,197,94,.4)' : 'rgba(148,163,184,.2)'}`,
                  }}>{isBuy ? 'TRADE TODAY' : 'WAIT FOR FRIDAY'}</span>
                </div>
              </div>

              {/* Trade parameters grid — exact $ only when buy window is open */}
              {isBuy && f.timing.buy_window_active ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>ENTRY (LIVE)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>${tp.entry_price?.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--green)' }}>Buy now</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(34,197,94,.08)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>TAKE PROFIT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>${tp.tp_price?.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--green)' }}>+{f.config.tp_pct}% (+${tp.tp_dollar?.toLocaleString()})</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(239,68,68,.08)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>STOP LOSS</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>${tp.sl_price?.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--red)' }}>{f.config.sl_pct}% (-${tp.sl_dollar?.toLocaleString()})</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>HOLD</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cyan)' }}>{f.config.hold_days}d</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>max hold time</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>POSITION</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>${(tp.position_size / 1000).toFixed(0)}K</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>full position</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(34,197,94,.08)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>TAKE PROFIT</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>+{f.config.tp_pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>+${tp.tp_dollar?.toLocaleString()} on $270K</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(239,68,68,.08)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>STOP LOSS</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{f.config.sl_pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>-${tp.sl_dollar?.toLocaleString()} on $270K</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>HOLD</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cyan)' }}>{f.config.hold_days}d</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>max hold time</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>POSITION</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--amber)' }}>${(tp.position_size / 1000).toFixed(0)}K</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Fri 4PM Dubai</div>
                  </div>
                </div>
              )}

              {/* Buy window status */}
              <div style={{
                padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12,
                background: f.timing.buy_window_active ? 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(6,182,212,.08))' : 'rgba(30,41,59,.4)',
                border: f.timing.buy_window_active ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(30,41,59,.5)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: f.timing.buy_window_active ? 'var(--green)' : 'var(--text)' }}>
                      {f.timing.buy_window_active ? 'BUY WINDOW OPEN' : 'Entry Window'}
                    </span>
                    {f.timing.buy_window_active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'pulse 1.5s infinite' }} />}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                    Entry: <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{f.timing.entry_dubai}</span> | Exit: <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{f.timing.exit_dubai}</span>
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: f.timing.buy_window_active ? 'var(--green)' : 'var(--muted)', fontStyle: 'italic' }}>{f.timing.window_note}</div>
              </div>

              {/* Tier conditions + backtest stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Conditions */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Tier {f.tier} Conditions: {f.met_count}/{f.total_count}
                  </div>
                  {f.conditions.map((c: WeeklyTierCond) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(30,41,59,.3)' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                        background: c.met ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.1)',
                        color: c.met ? 'var(--green)' : 'var(--red)',
                      }}>{c.met ? '\u2713' : '\u2717'}</span>
                      <span style={{ flex: 1, color: c.met ? 'var(--text)' : 'var(--muted)', fontSize: 12 }}>{c.label}</span>
                      <span style={{ color: c.met ? 'var(--green)' : 'var(--muted)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{c.value}</span>
                    </div>
                  ))}

                  {/* Show all 3 tier summaries */}
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>All Tiers This Week:</div>
                    {[
                      { t: 1, info: weekly.all_tiers.tier1, c: '#10b981' },
                      { t: 2, info: weekly.all_tiers.tier2, c: '#06b6d4' },
                      { t: 3, info: weekly.all_tiers.tier3, c: '#f59e0b' },
                    ].map(({ t, info, c }) => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', background: f.tier === t ? c : 'var(--border)',
                          boxShadow: f.tier === t ? `0 0 6px ${c}` : 'none',
                        }} />
                        <span style={{ color: f.tier === t ? c : 'var(--muted)', fontWeight: f.tier === t ? 700 : 400 }}>
                          Tier {t}: {info.met}/{info.total} conditions
                          {f.tier === t && ' (ACTIVE)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Backtest stats */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Backtest Stats (10yr, 522 Fridays)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: cb.win_rate >= 65 ? 'var(--green)' : cb.win_rate >= 60 ? 'var(--cyan)' : 'var(--amber)' }}>{cb.win_rate}%</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>COMBINED WR</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{cb.trades_per_year}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>TRADES/YR</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: cb.expectancy > 0 ? 'var(--green)' : 'var(--red)' }}>{cb.expectancy > 0 ? '+' : ''}{cb.expectancy}%</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>EXPECTANCY</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 12 }}>
                    <div className="mr"><span className="mr-l">Tier 1 WR</span><span className="mr-v" style={{ color: '#10b981' }}>{f.tier === 1 ? f.config.win_rate : weekly.all_tiers.tier1.config.win_rate}%</span></div>
                    <div className="mr"><span className="mr-l">Tier 1 Freq</span><span className="mr-v">{weekly.all_tiers.tier1.config.trades_per_year}/yr</span></div>
                    <div className="mr"><span className="mr-l">Tier 2 WR</span><span className="mr-v" style={{ color: '#06b6d4' }}>{weekly.all_tiers.tier2.config.win_rate}%</span></div>
                    <div className="mr"><span className="mr-l">Tier 2 Freq</span><span className="mr-v">{weekly.all_tiers.tier2.config.trades_per_year}/yr</span></div>
                    <div className="mr"><span className="mr-l">Tier 3 WR</span><span className="mr-v" style={{ color: '#f59e0b' }}>{weekly.all_tiers.tier3.config.win_rate}%</span></div>
                    <div className="mr"><span className="mr-l">Tier 3 Freq</span><span className="mr-v">{weekly.all_tiers.tier3.config.trades_per_year}/yr</span></div>
                  </div>

                  {/* Annual projection */}
                  <div style={{
                    padding: 12, borderRadius: 8, marginTop: 8,
                    background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(234,179,8,.04))',
                    border: '1px solid rgba(245,158,11,.2)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>$270K Annual Projection</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: cb.projection_270k.annual_pnl > 0 ? 'var(--green)' : 'var(--red)' }}>
                          ${cb.projection_270k.annual_pnl > 0 ? '+' : ''}{cb.projection_270k.annual_pnl.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>ANNUAL P&L</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>{cb.projection_270k.annual_roi_pct}%</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>ANNUAL ROI</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>{cb.max_drawdown}%</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>MAX DRAWDOWN</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Friday Optimal Entry Timing */}
        {fridayTiming && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div className="sec-title" style={{ marginBottom: 0 }}><span className="dot" style={{ background: '#f59e0b' }} /> Friday Optimal Entry Time</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>10yr daily + 2yr hourly backtest</span>
                <span style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid rgba(245,158,11,.3)' }}>
                  BEST: {String(fridayTiming.best_entry.hour_dubai).padStart(2, '0')}:00 Dubai
                </span>
              </div>
            </div>

            {/* Best entry highlight */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,.1), rgba(234,179,8,.05))',
              border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: 16, marginBottom: 20,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Entry (Dubai)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{String(fridayTiming.best_entry.hour_dubai).padStart(2, '0')}:00</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{String(fridayTiming.best_entry.hour_utc).padStart(2, '0')}:00 UTC / {String(fridayTiming.best_entry.hour_et).padStart(2, '0')}:00 ET</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>TP +0.5% Hit Rate</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{fridayTiming.best_entry.tp_hit_rate}%</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>within 24h</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Win Rate (Sat 8AM)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: fridayTiming.best_entry.win_rate_sat_8am >= 55 ? 'var(--green)' : 'var(--cyan)' }}>{fridayTiming.best_entry.win_rate_sat_8am}%</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>exit Sat 8AM Dubai</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Avg Return</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: pctCol(fridayTiming.best_entry.avg_return) }}>{pctSign(fridayTiming.best_entry.avg_return)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>per trade</div>
              </div>
            </div>

            {/* Hourly ranking table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Entry Hour Ranking (Friday US Session → Sat 8AM Dubai)</div>
              <table>
                <thead><tr>
                  <th>Rank</th><th>Dubai</th><th>UTC</th><th>ET</th>
                  <th>TP Hit</th><th>SL Hit</th><th>WR (Sat 8AM)</th><th>Avg Ret</th><th>Trades</th><th>Score</th>
                </tr></thead>
                <tbody>
                  {fridayTiming.ranked_entry_hours.map((h: FridayHourStat, i: number) => (
                    <tr key={h.entry_hour_utc} style={{ background: i === 0 ? 'rgba(245,158,11,.08)' : i < 3 ? 'rgba(34,197,94,.04)' : 'transparent' }}>
                      <td style={{ fontWeight: 700, color: i === 0 ? '#f59e0b' : i < 3 ? 'var(--green)' : 'var(--muted)' }}>#{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{String(h.entry_hour_dubai).padStart(2, '0')}:00</td>
                      <td>{String(h.entry_hour_utc).padStart(2, '0')}:00</td>
                      <td>{String(h.entry_hour_et).padStart(2, '0')}:00</td>
                      <td style={{ color: h.tp_hit_rate >= 60 ? 'var(--green)' : h.tp_hit_rate >= 50 ? 'var(--cyan)' : 'var(--text)' }}>{h.tp_hit_rate}%</td>
                      <td style={{ color: h.sl_hit_rate <= 20 ? 'var(--green)' : h.sl_hit_rate <= 30 ? 'var(--text)' : 'var(--red)' }}>{h.sl_hit_rate}%</td>
                      <td style={{ color: (h.sat_4am_utc_wr ?? 0) >= 55 ? 'var(--green)' : 'var(--text)' }}>{h.sat_4am_utc_wr ?? '--'}%</td>
                      <td style={{ color: pctCol(h.sat_4am_utc_avg ?? 0), fontWeight: 600 }}>{h.sat_4am_utc_avg != null ? pctSign(h.sat_4am_utc_avg) : '--'}</td>
                      <td>{h.trades}</td>
                      <td style={{ fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--muted)' }}>{h.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Month × Hour cross table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Month × Hour Win Rate Heatmap (Friday → Sat 8AM Dubai)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: 12 }}>
                  <thead><tr>
                    <th>Month</th>
                    {[18, 19, 20, 21, 22, 23, 0, 1].map((h) => (
                      <th key={h} style={{ textAlign: 'center', minWidth: 60 }}>{String(h).padStart(2, '0')}:00</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, mi) => (
                      <tr key={m}>
                        <td style={{ fontWeight: 700 }}>{m}</td>
                        {[18, 19, 20, 21, 22, 23, 0, 1].map((dh) => {
                          const utcH = (dh - 4 + 24) % 24;
                          const cell = fridayTiming.month_hour_cross_table.find(
                            (c: FridayCrossCell) => c.month_num === mi + 1 && c.entry_hour_utc === utcH
                          );
                          if (!cell || cell.trades < 2) return <td key={dh} style={{ textAlign: 'center', color: 'var(--muted)' }}>--</td>;
                          const wr = cell.win_rate;
                          const intensity = Math.min(Math.max((wr - 30) / 50, 0), 1);
                          const bg = wr >= 60
                            ? `rgba(34,197,94,${intensity * 0.35})`
                            : wr >= 50
                              ? `rgba(6,182,212,${intensity * 0.2})`
                              : `rgba(239,68,68,${(1 - intensity) * 0.2})`;
                          return (
                            <td key={dh} style={{
                              textAlign: 'center', background: bg, fontWeight: wr >= 70 ? 700 : 400,
                              color: wr >= 70 ? 'var(--green)' : wr >= 55 ? 'var(--text)' : wr < 40 ? 'var(--red)' : 'var(--muted)',
                            }}>
                              {wr}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>Hours shown in Dubai time (GST = UTC+4). Green = high win rate, Red = avoid.</div>
            </div>

            {/* 10-Year Monthly Friday Stats */}
            <div className="grid-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>10-Year Monthly Friday Performance</div>
                <table>
                  <thead><tr><th>Month</th><th>Fridays</th><th>1d WR</th><th>1d Avg</th><th>2d WR</th><th>2d Avg</th></tr></thead>
                  <tbody>
                    {fridayTiming.monthly_friday_stats.map((m: FridayMonthlyStat) => (
                      <tr key={m.month}>
                        <td style={{ fontWeight: 700 }}>{m.month}</td>
                        <td>{m.fridays}</td>
                        <td style={{ color: m.win_rate_1d >= 55 ? 'var(--green)' : m.win_rate_1d < 48 ? 'var(--red)' : 'var(--text)' }}>{m.win_rate_1d}%</td>
                        <td style={{ color: pctCol(m.avg_return_1d), fontWeight: 600 }}>{pctSign(m.avg_return_1d)}</td>
                        <td style={{ color: m.win_rate_2d >= 55 ? 'var(--green)' : m.win_rate_2d < 48 ? 'var(--red)' : 'var(--text)' }}>{m.win_rate_2d}%</td>
                        <td style={{ color: pctCol(m.avg_return_2d), fontWeight: 600 }}>{pctSign(m.avg_return_2d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>10-Year Yearly Friday Performance</div>
                <table>
                  <thead><tr><th>Year</th><th>Fridays</th><th>Win Rate</th><th>Avg Return</th><th></th></tr></thead>
                  <tbody>
                    {fridayTiming.yearly_friday_stats.map((y: { year: number; fridays: number; avg_return: number; win_rate: number }) => (
                      <tr key={y.year}>
                        <td style={{ fontWeight: 700 }}>{y.year}</td>
                        <td>{y.fridays}</td>
                        <td style={{ color: y.win_rate >= 55 ? 'var(--green)' : y.win_rate < 48 ? 'var(--red)' : 'var(--text)' }}>{y.win_rate}%</td>
                        <td style={{ color: pctCol(y.avg_return), fontWeight: 600 }}>{pctSign(y.avg_return)}</td>
                        <td><div className="bar-w"><div className="bar" style={{ width: Math.min(Math.abs(y.avg_return) * 200, 120), background: pctCol(y.avg_return) }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BTC Chart */}
        <div className="card" style={{ marginBottom: 24 }}>
          {/* Header row: title + interval buttons + range buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div className="sec-title" style={{ marginBottom: 0 }}><span className="dot" style={{ background: 'var(--text)' }} /> BTC / USD</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Interval selector */}
              <div style={{ display: 'flex', gap: 2, background: 'rgba(30,41,59,.5)', borderRadius: 8, padding: 2 }}>
                {[{ v: '1h', l: '1H' }, { v: '2h', l: '2H' }, { v: '4h', l: '4H' }, { v: '1d', l: '1D' }].map(({ v, l }) => (
                  <button key={v} onClick={() => {
                    setBtcChartInterval(v);
                    const defaultRange = v === '1h' ? '7d' : v === '2h' ? '14d' : v === '4h' ? '30d' : '6mo';
                    setBtcChartRange(defaultRange);
                    loadBtcChart(v, defaultRange);
                  }} style={{
                    background: btcChartInterval === v ? 'var(--cyan)' : 'transparent',
                    color: btcChartInterval === v ? '#000' : 'var(--muted)',
                    border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12,
                    fontWeight: 700, cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
              {/* Range selector */}
              <div style={{ display: 'flex', gap: 2 }}>
                {(btcChartInterval === '1d'
                  ? ['1mo', '3mo', '6mo', '1y', '2y']
                  : btcChartInterval === '4h'
                    ? ['7d', '14d', '30d', '60d', '90d']
                    : btcChartInterval === '2h'
                      ? ['7d', '14d', '30d', '60d']
                      : ['1d', '3d', '5d', '7d', '14d', '30d']
                ).map((r) => (
                  <button key={r} onClick={() => { setBtcChartRange(r); loadBtcChart(btcChartInterval, r); }} style={{
                    background: btcChartRange === r ? 'var(--blue)' : 'transparent',
                    color: btcChartRange === r ? '#fff' : 'var(--muted)',
                    border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
                  }}>{r}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Event toggle row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {([
              { key: 'full_moon', icon: '🌕', label: 'Full Moon', c: '#fbbf24' },
              { key: 'new_moon', icon: '🌑', label: 'New Moon', c: '#64748b' },
              { key: 'lunar_eclipse', icon: '🌒', label: 'Lunar Eclipse', c: '#ef4444' },
              { key: 'solar_eclipse', icon: '☀️', label: 'Solar Eclipse', c: '#f97316' },
              { key: 'fomc', icon: '🏛️', label: 'FOMC', c: '#3b82f6' },
              { key: 'earnings', icon: '📊', label: 'Mag7 Earnings', c: '#22c55e' },
            ] as const).map(({ key, icon, label, c }) => {
              const on = eventsVisible[key as keyof typeof eventsVisible];
              return (
                <button key={key} onClick={() => setEventsVisible((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: on ? `${c}22` : 'transparent',
                  border: `1px solid ${on ? c : 'var(--border)'}`,
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600,
                  color: on ? c : 'var(--muted)', cursor: 'pointer', opacity: on ? 1 : 0.5,
                }}>{icon} {label}</button>
              );
            })}
          </div>
          {btcChart ? (
            <>
              <div style={{ position: 'relative', height: 380 }}><canvas ref={btcPriceChartRef} /></div>
              <div style={{ position: 'relative', height: 80, marginTop: 4 }}><canvas ref={btcVolChartRef} /></div>
              <div style={{ position: 'relative', height: 100, marginTop: 4 }}>
                <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 10, color: 'var(--muted)', zIndex: 1 }}>RSI (14)</div>
                <canvas ref={btcRsiChartRef} />
              </div>
            </>
          ) : <div className="loading" style={{ height: 560 }}>Loading chart...</div>}
        </div>

        {/* Top metrics */}
        <div className="grid-top">
          <div className="card" style={{ border: binance ? '1px solid rgba(245,158,11,.3)' : undefined }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>BTC / USDT</span>
              {binance && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,.12)', padding: '2px 6px', borderRadius: 4 }}>BINANCE LIVE</span>}
            </div>
            <div className="card-value" style={{ color: (binance?.change_pct ?? live?.change_pct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {binance ? '$' + fmt(binance.price) : live ? '$' + fmt(live.price) : '--'}
            </div>
            <div className="card-sub">
              {binance ? <span style={{ color: pctCol(binance.change_pct) }}>{pctSign(binance.change_pct)}</span> : live ? <span style={{ color: pctCol(live.change_pct) }}>{pctSign(live.change_pct)}</span> : '--'} (24h)
            </div>
            {binance && (
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                H: ${fmt(binance.high_24h)} L: ${fmt(binance.low_24h)} | Spread: ${binance.spread.value}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title">RSI (14)</div>
            <div className="card-value" style={{ color: live ? (live.rsi_14 > 70 ? 'var(--red)' : live.rsi_14 < 30 ? 'var(--green)' : 'var(--text)') : undefined }}>{live ? live.rsi_14 : '--'}</div>
            <div className="card-sub" style={{ fontSize: 11 }}>{live ? (live.rsi_14 > 70 ? 'Overbought' : live.rsi_14 < 30 ? 'Oversold' : live.rsi_14 < 40 ? 'Approaching Oversold' : live.rsi_14 > 60 ? 'Approaching Overbought' : 'Neutral') : '--'}</div>
          </div>
          <div className="card">
            <div className="card-title">M2 Money Supply</div>
            <div className="card-value" style={{ fontSize: 28 }}>{macro ? '$' + (macro.m2_latest / 1000).toFixed(1) + 'T' : '--'}</div>
            <div className="card-sub">{macro ? <><span style={{ color: pctCol(macro.m2_yoy_pct) }}>YoY: {pctSign(macro.m2_yoy_pct)}</span> | MoM: ${macro.m2_change_mom}B</> : '--'}</div>
          </div>
          <div className="card">
            <div className="card-title">DXY (Dollar Index)</div>
            <div className="card-value" style={{ fontSize: 28 }}>{dxy ? dxy.dxy : '--'}</div>
            <div className="card-sub">{dxy ? <span style={{ color: pctCol(dxy.change_pct) }}>{pctSign(dxy.change_pct)}</span> : '--'}</div>
          </div>
        </div>

        {/* Binance Order Book & Volume */}
        {binance && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <div className="card-title">Binance Order Book</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>BIDS (Buy)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)' }}>ASKS (Sell)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div>
                  {binance.order_book.bids.slice(0, 5).map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(30,41,59,.3)' }}>
                      <span style={{ color: 'var(--green)' }}>${fmt(b.price)}</span>
                      <span style={{ color: 'var(--muted)' }}>{b.qty.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {binance.order_book.asks.slice(0, 5).map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(30,41,59,.3)' }}>
                      <span style={{ color: 'var(--red)' }}>${fmt(a.price)}</span>
                      <span style={{ color: 'var(--muted)' }}>{a.qty.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                Bid Wall: {binance.order_book.bid_wall.qty.toFixed(3)} BTC @ ${fmt(binance.order_book.bid_wall.price)} (${binance.order_book.bid_wall.usd.toLocaleString()})<br/>
                Ask Wall: {binance.order_book.ask_wall.qty.toFixed(3)} BTC @ ${fmt(binance.order_book.ask_wall.price)} (${binance.order_book.ask_wall.usd.toLocaleString()})
              </div>
            </div>
            <div className="card">
              <div className="card-title">Market Pressure</div>
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <div style={{
                  fontSize: 20, fontWeight: 800, padding: '8px 16px', borderRadius: 8, display: 'inline-block',
                  background: binance.order_book.pressure === 'BUY_PRESSURE' ? 'rgba(34,197,94,.15)' : binance.order_book.pressure === 'SELL_PRESSURE' ? 'rgba(239,68,68,.15)' : 'rgba(148,163,184,.1)',
                  color: binance.order_book.pressure === 'BUY_PRESSURE' ? 'var(--green)' : binance.order_book.pressure === 'SELL_PRESSURE' ? 'var(--red)' : 'var(--muted)',
                }}>{binance.order_book.pressure.replace('_', ' ')}</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <div className="mr"><span className="mr-l">Bid/Ask Ratio</span><span className="mr-v" style={{ color: binance.order_book.bid_ask_ratio > 1 ? 'var(--green)' : 'var(--red)' }}>{binance.order_book.bid_ask_ratio}x</span></div>
                <div className="mr"><span className="mr-l">Bid Depth</span><span className="mr-v">{binance.order_book.bid_depth_btc} BTC</span></div>
                <div className="mr"><span className="mr-l">Ask Depth</span><span className="mr-v">{binance.order_book.ask_depth_btc} BTC</span></div>
                <div className="mr"><span className="mr-l">Spread</span><span className="mr-v">${binance.spread.value} ({binance.spread.pct}%)</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Binance Volume</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div className="mr"><span className="mr-l">24h Volume</span><span className="mr-v">{binance.volume_24h_btc.toLocaleString()} BTC</span></div>
                <div className="mr"><span className="mr-l">24h Turnover</span><span className="mr-v">${(binance.volume_24h_usdt / 1e9).toFixed(2)}B</span></div>
                <div className="mr"><span className="mr-l">24h Trades</span><span className="mr-v">{binance.trades_24h.toLocaleString()}</span></div>
                <div className="mr"><span className="mr-l">Current Hour</span><span className="mr-v">{binance.volume_profile.current_hour_btc} BTC</span></div>
                <div className="mr"><span className="mr-l">Avg Hour</span><span className="mr-v">{binance.volume_profile.avg_hourly_btc} BTC</span></div>
                <div className="mr"><span className="mr-l">Vol Ratio</span><span className="mr-v" style={{ color: binance.volume_profile.is_low_volume ? 'var(--green)' : 'var(--text)' }}>{binance.volume_profile.vol_ratio}x {binance.volume_profile.is_low_volume ? '(LOW)' : ''}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Macro row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card"><div className="card-title">Fed Funds Rate</div><div className="card-value" style={{ fontSize: 28 }}>{macro ? macro.fed_funds_rate + '%' : '--'}</div></div>
          <div className="card"><div className="card-title">Fed Balance Sheet</div><div className="card-value" style={{ fontSize: 28 }}>{macro ? '$' + macro.fed_balance_sheet + 'T' : '--'}</div></div>
          <div className="card"><div className="card-title">Yield Curve (10Y-2Y)</div><div className="card-value" style={{ fontSize: 28, color: macro ? (macro.yield_curve_10y2y >= 0 ? 'var(--green)' : 'var(--red)') : undefined }}>{macro ? macro.yield_curve_10y2y + '%' : '--'}</div></div>
          <div className="card">
            <div className="card-title">VIX (Fear Index)</div>
            {live?.vix ? (
              <>
                <div className="card-value" style={{ fontSize: 28, color: live.vix.price >= 25 ? 'var(--red)' : live.vix.price >= 20 ? 'var(--amber)' : 'var(--green)' }}>{live.vix.price}</div>
                <div className="card-sub">
                  <span style={{ color: pctCol(-live.vix.change_pct) }}>{pctSign(live.vix.change_pct)}</span>
                  {' '}<span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                    background: live.vix.price >= 25 ? 'rgba(239,68,68,.15)' : live.vix.price >= 20 ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.15)',
                    color: live.vix.price >= 25 ? 'var(--red)' : live.vix.price >= 20 ? 'var(--amber)' : 'var(--green)',
                  }}>{live.vix.zone}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  SMA20: {live.vix.sma_20} {live.vix.above_sma20 ? '(above)' : '(below)'}<br/>
                  5d: {live.vix.range_5d.low}–{live.vix.range_5d.high} | 6m: {live.vix.low_6m}–{live.vix.high_6m}
                </div>
              </>
            ) : <div className="card-value" style={{ fontSize: 28 }}>--</div>}
          </div>
        </div>

        {/* Technicals + SPX + M2 chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--blue)' }} /> BTC Technical Indicators</div>
            {live ? (
              <>
                {[
                  ['MACD', live.macd, pctCol(live.macd)],
                  ['MACD Signal', live.macd_signal, undefined],
                  ['MACD Histogram', live.macd_hist, pctCol(live.macd_hist)],
                  ['Bollinger Upper', '$' + fmt(live.bb_upper), undefined],
                  ['Bollinger Mid (SMA20)', '$' + fmt(live.bb_mid), undefined],
                  ['Bollinger Lower', '$' + fmt(live.bb_lower), undefined],
                  ['EMA 20', '$' + fmt(live.ema_20), undefined],
                  ['EMA 50', '$' + fmt(live.ema_50), undefined],
                  ['SMA 200', live.sma_200 ? '$' + fmt(live.sma_200) : 'N/A (building)', undefined],
                ].map(([label, value, color]) => (
                  <div className="mr" key={label as string}><span className="mr-l">{label as string}</span><span className="mr-v" style={color ? { color: color as string } : undefined}>{String(value)}</span></div>
                ))}
              </>
            ) : <div className="loading">Loading...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--amber)' }} /> S&P 500 (SPX)</div>
            {live?.spx ? (() => {
              const s = live.spx;
              return (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.price)}</div>
                    <div style={{ fontSize: 14, color: pctCol(s.change_pct) }}>{pctSign(s.change_pct)} today</div>
                  </div>
                  {[
                    ['RSI (14)', String(s.rsi_14), s.rsi_14 > 70 ? 'var(--red)' : s.rsi_14 < 30 ? 'var(--green)' : undefined],
                    ['EMA 20', fmt(s.ema_20), s.price > s.ema_20 ? 'var(--green)' : 'var(--red)'],
                    ['EMA 50', fmt(s.ema_50), s.price > s.ema_50 ? 'var(--green)' : 'var(--red)'],
                    ['SMA 200', s.sma_200 ? fmt(s.sma_200) : 'N/A', s.sma_200 ? (s.price > s.sma_200 ? 'var(--green)' : 'var(--red)') : undefined],
                    ['MACD', String(s.macd), pctCol(s.macd)],
                    ['MACD Histogram', String(s.macd_hist), pctCol(s.macd_hist)],
                    ['From 52w High', pctSign(s.from_high_pct), pctCol(s.from_high_pct)],
                    ['52w High', fmt(s.high_52w), undefined],
                    ['52w Low', fmt(s.low_52w), undefined],
                    ['5d Range', fmt(s.range_5d.low) + ' – ' + fmt(s.range_5d.high), undefined],
                    ['20d Range', fmt(s.range_20d.low) + ' – ' + fmt(s.range_20d.high), undefined],
                  ].map(([label, value, color]) => (
                    <div className="mr" key={label as string}><span className="mr-l">{label as string}</span><span className="mr-v" style={color ? { color: color as string } : undefined}>{String(value)}</span></div>
                  ))}
                </>
              );
            })() : <div className="loading">Loading...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--purple)' }} /> M2 Money Supply (10 Years)</div>
            <div className="chart-wrap"><canvas ref={m2ChartRef} /></div>
          </div>
        </div>

        {/* Correlations */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="sec-title"><span className="dot" style={{ background: 'var(--purple)' }} /> BTC Correlations (30-day rolling)</div>
          <div className="chart-wrap"><canvas ref={corrChartRef} /></div>
        </div>
      </div>
    </>
  );
}
