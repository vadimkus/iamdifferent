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
interface HourlyStat {
  hour_utc: number; hour_dubai: number; avg_return: number; win_rate: number; volatility: number; count: number;
}
interface CorrData {
  matrix: { btc_spx: number; btc_gold: number; spx_gold: number };
  rolling_30d: { date: string; btc_spx: number | null; btc_gold: number | null }[];
}
interface RecCondition {
  id: string; name: string; description: string; value: string;
  met: boolean; edge: string; weight: number;
}
interface RecData {
  score: number; recommendation: string; confidence: string;
  conditions: RecCondition[]; met_count: number; total_count: number;
  best_combo_active: boolean; best_combo_note: string | null;
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

declare const Chart: any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ---------- helpers ----------
const fmt = (n: number | null | undefined) => n == null ? '--' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const pctSign = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const pctCol = (v: number) => (v >= 0 ? '#22c55e' : '#ef4444');

function clockStr(tz: string) {
  return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour12: false });
}

// ---------- component ----------
export default function BTCPage() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [dxy, setDxy] = useState<DxyData | null>(null);
  const [sessions, setSessions] = useState<HourlyStat[] | null>(null);
  const [corr, setCorr] = useState<CorrData | null>(null);
  const [rec, setRec] = useState<RecData | null>(null);
  const [alpha, setAlpha] = useState<AlphaData | null>(null);
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
  const loadSessions = useCallback(async () => {
    try { const r = await fetch('/api/btc/sessions'); const d = await r.json(); setSessions(d.hourly_stats); } catch { /* */ }
  }, []);
  const loadCorr = useCallback(async () => {
    try { const r = await fetch('/api/btc/correlations'); setCorr(await r.json()); } catch { /* */ }
  }, []);
  const loadRec = useCallback(async () => {
    try { const r = await fetch('/api/btc/recommendation'); setRec(await r.json()); } catch { /* */ }
  }, []);
  const loadAlpha = useCallback(async () => {
    try { const r = await fetch('/api/btc/alpha-strategy'); setAlpha(await r.json()); } catch { /* */ }
  }, []);
  const loadBtcChart = useCallback(async (interval: string, range: string) => {
    try { const r = await fetch(`/api/btc/chart?interval=${interval}&range=${range}`); setBtcChart(await r.json()); } catch { /* */ }
  }, []);
  const loadEvents = useCallback(async () => {
    try { const r = await fetch('/api/btc/events?from=2024-01-01&to=2027-01-01'); const d: EventsData = await r.json(); setChartEvents(d.events); } catch { /* */ }
  }, []);

  useEffect(() => {
    loadLive(); loadMacro(); loadDxy(); loadSessions(); loadCorr(); loadRec(); loadAlpha(); loadBtcChart(btcChartInterval, btcChartRange); loadEvents();
    const id = setInterval(() => { loadLive(); loadRec(); loadAlpha(); }, 60_000);
    return () => clearInterval(id);
  }, [loadLive, loadMacro, loadDxy, loadSessions, loadCorr, loadRec, loadAlpha, loadBtcChart, btcChartInterval, btcChartRange, loadEvents]);

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
  function getSignal(d: LiveData) {
    let signals = 0;
    const reasons: string[] = [];
    if (d.rsi_14 < 40) { signals++; reasons.push('RSI < 40'); }
    if (d.macd_hist < 0) { signals++; reasons.push('MACD bearish'); }
    if (d.price < d.bb_mid) { signals++; reasons.push('Below BB mid'); }
    if (d.price < d.ema_20) { signals++; reasons.push('Below EMA20'); }

    const dubaiHour = parseInt(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai', hour: 'numeric', hour12: false }));
    const inWindow = dubaiHour >= 23 || dubaiHour < 1;

    if (signals >= 3 && inWindow) return { badge: 'buy', label: 'BUY WINDOW ACTIVE', reason: reasons.join(' + ') + ' | Dubai buy window open' };
    if (signals >= 3) return { badge: 'wait', label: 'WAIT FOR 12AM DUBAI', reason: reasons.join(' + ') };
    if (signals >= 2) return { badge: 'neutral', label: 'MIXED SIGNALS', reason: reasons.join(' + ') };
    return { badge: 'sell', label: 'NO TRADE', reason: 'Conditions not favorable' };
  }

  const signal = live ? getSignal(live) : null;

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
        .sb { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
        .sb-buy { background:rgba(34,197,94,.15); color:var(--green); border:1px solid rgba(34,197,94,.3); }
        .sb-sell { background:rgba(239,68,68,.15); color:var(--red); border:1px solid rgba(239,68,68,.3); }
        .sb-neutral { background:rgba(148,163,184,.1); color:var(--muted); border:1px solid rgba(148,163,184,.2); }
        .sb-wait { background:rgba(245,158,11,.15); color:var(--amber); border:1px solid rgba(245,158,11,.3); }
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
        .hg { display:grid; grid-template-columns:repeat(6,1fr); gap:4px; }
        .hc { padding:8px 4px; border-radius:6px; text-align:center; font-size:11px; font-weight:600; }
        .hc .hl { font-size:10px; color:rgba(255,255,255,.7); margin-bottom:2px; }
        .bar-w { display:flex; align-items:center; gap:6px; }
        .bar { height:6px; border-radius:3px; min-width:2px; }
        .loading { color:var(--muted); padding:40px; text-align:center; }
        .rec-box { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px; }
        .rec-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .rec-score { font-size:48px; font-weight:800; font-variant-numeric:tabular-nums; }
        .rec-badge { font-size:18px; font-weight:700; padding:8px 20px; border-radius:24px; }
        .rec-badge-high { background:rgba(34,197,94,.2); color:var(--green); border:2px solid rgba(34,197,94,.4); }
        .rec-badge-medium { background:rgba(6,182,212,.2); color:var(--cyan); border:2px solid rgba(6,182,212,.4); }
        .rec-badge-low { background:rgba(245,158,11,.2); color:var(--amber); border:2px solid rgba(245,158,11,.4); }
        .rec-badge-none { background:rgba(239,68,68,.15); color:var(--red); border:2px solid rgba(239,68,68,.3); }
        .score-bar { width:100%; height:8px; background:rgba(30,41,59,.8); border-radius:4px; margin:12px 0; overflow:hidden; }
        .score-fill { height:100%; border-radius:4px; transition:width .5s ease; }
        .combo-alert { background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(234,179,8,.08)); border:1px solid rgba(245,158,11,.4); border-radius:10px; padding:14px 18px; margin-bottom:16px; font-size:14px; font-weight:600; color:var(--amber); }
        .cond-row { display:grid; grid-template-columns:36px 1fr 140px 80px 60px; align-items:center; padding:12px 16px; border-bottom:1px solid rgba(30,41,59,.5); gap:12px; }
        .cond-row:last-child { border-bottom:none; }
        .cond-header { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); font-weight:500; }
        .cond-icon { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; }
        .cond-icon-yes { background:rgba(34,197,94,.2); color:var(--green); }
        .cond-icon-no { background:rgba(239,68,68,.1); color:var(--red); }
        .cond-name { font-weight:600; font-size:14px; }
        .cond-desc { font-size:12px; color:var(--muted); margin-top:2px; }
        .cond-val { font-size:13px; font-variant-numeric:tabular-nums; }
        .cond-edge { font-size:12px; font-weight:600; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        @media(max-width:1100px) { .alpha-grid { grid-template-columns:1fr !important; } }
        @media(max-width:900px) { .grid-top { grid-template-columns:repeat(2,1fr); } .grid-2,.steps { grid-template-columns:1fr; } .cond-row { grid-template-columns:28px 1fr; } .cond-desc,.cond-header:nth-child(n+3) { display:none; } }
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

        {/* Recommendation Table */}
        <div className="rec-box">
          <div className="rec-header">
            <div>
              <div className="sec-title" style={{ marginBottom: 4 }}><span className="dot" style={{ background: rec && rec.score >= 55 ? 'var(--green)' : 'var(--red)' }} /> Tonight&apos;s Trade Recommendation</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Based on 17 conditions: technicals, macro, lunar cycles, FOMC, Mag7 earnings</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {rec ? (
                <>
                  <div className="rec-score" style={{ color: rec.score >= 75 ? 'var(--green)' : rec.score >= 55 ? 'var(--cyan)' : rec.score >= 40 ? 'var(--amber)' : 'var(--red)' }}>{rec.score}%</div>
                  <div className={`rec-badge rec-badge-${rec.confidence}`}>{rec.recommendation}</div>
                </>
              ) : <div className="loading">Scoring...</div>}
            </div>
          </div>

          {rec && (
            <>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${rec.score}%`, background: rec.score >= 75 ? 'var(--green)' : rec.score >= 55 ? 'var(--cyan)' : rec.score >= 40 ? 'var(--amber)' : 'var(--red)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                <span>0% — NO TRADE</span>
                <span>{rec.met_count} / {rec.total_count} conditions met</span>
                <span>100% — STRONG BUY</span>
              </div>

              {rec.best_combo_active && rec.best_combo_note && (
                <div className="combo-alert">
                  {rec.best_combo_note}
                </div>
              )}

              <div className="cond-row cond-header">
                <div></div>
                <div>Condition</div>
                <div>Current Value</div>
                <div>Edge</div>
                <div>Weight</div>
              </div>
              {rec.conditions.map((c: RecCondition) => (
                <div className="cond-row" key={c.id}>
                  <div className={`cond-icon ${c.met ? 'cond-icon-yes' : 'cond-icon-no'}`}>{c.met ? '\u2713' : '\u2717'}</div>
                  <div>
                    <div className="cond-name" style={{ color: c.met ? 'var(--text)' : 'var(--muted)' }}>{c.name}</div>
                    <div className="cond-desc">{c.description}</div>
                  </div>
                  <div className="cond-val" style={{ color: c.met ? 'var(--green)' : 'var(--text)' }}>{c.value}</div>
                  <div className="cond-edge" style={{ color: 'var(--cyan)' }}>{c.edge}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{'★'.repeat(c.weight)}</div>
                </div>
              ))}
            </>
          )}
        </div>

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
          <div className="card">
            <div className="card-title">BTC / USD</div>
            <div className="card-value" style={{ color: live && live.change_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>{live ? '$' + fmt(live.price) : '--'}</div>
            <div className="card-sub">{live ? <span style={{ color: pctCol(live.change_pct) }}>{pctSign(live.change_pct)}</span> : '--'} (24h)</div>
          </div>
          <div className="card">
            <div className="card-title">RSI (14)</div>
            <div className="card-value" style={{ color: live ? (live.rsi_14 > 70 ? 'var(--red)' : live.rsi_14 < 30 ? 'var(--green)' : 'var(--text)') : undefined }}>{live ? live.rsi_14 : '--'}</div>
            <div className="card-sub">{live ? (live.rsi_14 > 70 ? <span className="sb sb-sell">Overbought</span> : live.rsi_14 < 30 ? <span className="sb sb-buy">Oversold</span> : live.rsi_14 < 40 ? <span className="sb sb-wait">Approaching Oversold</span> : live.rsi_14 > 60 ? <span className="sb sb-wait">Approaching Overbought</span> : <span className="sb sb-neutral">Neutral</span>) : '--'}</div>
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
                  {' '}<span className={`sb ${live.vix.price >= 25 ? 'sb-sell' : live.vix.price >= 20 ? 'sb-wait' : 'sb-buy'}`} style={{ fontSize: 10, padding: '2px 8px' }}>{live.vix.zone}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  SMA20: {live.vix.sma_20} {live.vix.above_sma20 ? '(above)' : '(below)'}<br/>
                  5d: {live.vix.range_5d.low}–{live.vix.range_5d.high} | 6m: {live.vix.low_6m}–{live.vix.high_6m}
                </div>
              </>
            ) : <div className="card-value" style={{ fontSize: 28 }}>--</div>}
          </div>
          <div className="card">
            <div className="card-title">Trade Signal</div>
            <div style={{ marginTop: 8 }}>{signal ? <span className={`sb sb-${signal.badge}`}>{signal.label}</span> : <span className="sb sb-neutral">LOADING</span>}</div>
            <div className="card-sub" style={{ marginTop: 8 }}>{signal?.reason ?? '--'}</div>
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

        {/* Session heatmap + Correlations */}
        <div className="grid-2">
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--red)' }} /> Hourly Session Heatmap (Avg Return %)</div>
            {sessions ? (
              <>
                <div className="hg">
                  {sessions.map((h: HourlyStat) => {
                    const intensity = Math.min(Math.abs(h.avg_return) * 300, 1);
                    const bg = h.avg_return >= 0 ? `rgba(34,197,94,${intensity})` : `rgba(239,68,68,${intensity})`;
                    const isBuy = h.hour_utc === 20;
                    const isSell = h.hour_utc === 2;
                    const border = isBuy ? '2px solid var(--green)' : isSell ? '2px solid var(--cyan)' : 'none';
                    return (
                      <div className="hc" key={h.hour_utc} style={{ background: bg, border }}>
                        <div className="hl">{String(h.hour_dubai).padStart(2, '0')}:00 GST</div>
                        <div>{h.avg_return >= 0 ? '+' : ''}{h.avg_return.toFixed(3)}%</div>
                        <div className="hl">Win {h.win_rate}%</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>Green border = BUY window | Cyan border = SELL window</div>
              </>
            ) : <div className="loading">Loading...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--purple)' }} /> BTC Correlations (30-day rolling)</div>
            <div className="chart-wrap"><canvas ref={corrChartRef} /></div>
          </div>
        </div>
      </div>
    </>
  );
}
