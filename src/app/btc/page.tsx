'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Script from 'next/script';

// ---------- types ----------
interface LiveData {
  price: number; change_pct: number; rsi_14: number;
  macd: number; macd_signal: number; macd_hist: number;
  bb_upper: number; bb_mid: number; bb_lower: number;
  ema_20: number; ema_50: number; sma_200: number | null;
}
interface MacroData {
  m2_latest: number; m2_change_mom: number; m2_yoy_pct: number;
  m2_history: { date: string; value: number }[];
  fed_balance_sheet: number; fed_funds_rate: number; yield_curve_10y2y: number;
}
interface DxyData { dxy: number; change_pct: number }
interface StrategySummary {
  total_trades: number; win_rate: number; wins: number; losses: number;
  avg_return: number; median_return: number; cum_return: number;
  max_win: number; max_loss: number; sharpe: number;
}
interface DowStat { day: string; trades: number; win_rate: number; avg_return: number; cum_return: number }
interface MonthStat { month: string; trades: number; win_rate: number; avg_return: number; cum_return: number }
interface EquityPoint { date: string; equity: number }
interface RecentTrade { date: string; buy: number; sell: number; return_pct: number; dow: string }
interface StrategyData {
  summary: StrategySummary; by_day: DowStat[]; by_month: MonthStat[];
  equity_curve: EquityPoint[]; recent_trades: RecentTrade[];
}
interface HourlyStat {
  hour_utc: number; hour_dubai: number; avg_return: number; win_rate: number; volatility: number; count: number;
}
interface CorrData {
  matrix: { btc_spx: number; btc_gold: number; spx_gold: number };
  rolling_30d: { date: string; btc_spx: number | null; btc_gold: number | null }[];
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
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [sessions, setSessions] = useState<HourlyStat[] | null>(null);
  const [corr, setCorr] = useState<CorrData | null>(null);
  const [clocks, setClocks] = useState({ dubai: '--:--:--', ny: '--:--:--', utc: '--:--:--' });
  const [chartReady, setChartReady] = useState(false);

  const equityChartRef = useRef<HTMLCanvasElement>(null);
  const m2ChartRef = useRef<HTMLCanvasElement>(null);
  const corrChartRef = useRef<HTMLCanvasElement>(null);
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
  const loadStrategy = useCallback(async () => {
    try { const r = await fetch('/api/btc/strategy'); setStrategy(await r.json()); } catch { /* */ }
  }, []);
  const loadSessions = useCallback(async () => {
    try { const r = await fetch('/api/btc/sessions'); const d = await r.json(); setSessions(d.hourly_stats); } catch { /* */ }
  }, []);
  const loadCorr = useCallback(async () => {
    try { const r = await fetch('/api/btc/correlations'); setCorr(await r.json()); } catch { /* */ }
  }, []);

  useEffect(() => {
    loadLive(); loadMacro(); loadDxy(); loadStrategy(); loadSessions(); loadCorr();
    const id = setInterval(loadLive, 60_000);
    return () => clearInterval(id);
  }, [loadLive, loadMacro, loadDxy, loadStrategy, loadSessions, loadCorr]);

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

    if (strategy && equityChartRef.current) {
      const eq = strategy.equity_curve.filter((_: EquityPoint, i: number) => i % 15 === 0);
      chartInstances.current.push(new Chart(equityChartRef.current, {
        type: 'line',
        data: {
          labels: eq.map((e: EquityPoint) => e.date),
          datasets: [{ label: 'Equity ($)', data: eq.map((e: EquityPoint) => e.equity), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,.1)', fill: true, tension: .3, pointRadius: 0 }],
        },
        options: chartOpts('$'),
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
  }, [chartReady, strategy, macro, corr]);

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
        .strat-box { background:linear-gradient(135deg,rgba(34,197,94,.08) 0%,rgba(6,182,212,.08) 100%); border:1px solid rgba(34,197,94,.2); border-radius:12px; padding:24px; margin-bottom:24px; }
        .strat-box h2 { font-size:20px; margin-bottom:12px; color:var(--text); }
        .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:16px; }
        .step { text-align:center; padding:16px; background:rgba(0,0,0,.2); border-radius:8px; }
        .step .num { font-size:28px; font-weight:700; color:var(--cyan); }
        .step .desc { font-size:12px; color:var(--muted); margin-top:4px; }
        .step .time { font-size:16px; font-weight:600; margin-top:4px; color:var(--text); }
        .hg { display:grid; grid-template-columns:repeat(6,1fr); gap:4px; }
        .hc { padding:8px 4px; border-radius:6px; text-align:center; font-size:11px; font-weight:600; }
        .hc .hl { font-size:10px; color:rgba(255,255,255,.7); margin-bottom:2px; }
        .bar-w { display:flex; align-items:center; gap:6px; }
        .bar { height:6px; border-radius:3px; min-width:2px; }
        .loading { color:var(--muted); padding:40px; text-align:center; }
        @media(max-width:900px) { .grid-top { grid-template-columns:repeat(2,1fr); } .grid-2,.steps { grid-template-columns:1fr; } }
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
        {/* Strategy box */}
        <div className="strat-box">
          <h2>Strategy: US Session Close &rarr; Dubai Morning Recovery</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Buy BTC during late US session weakness, sell during Asian/Dubai early morning recovery. Backtested over 722 trades (2 years).</p>
          <div className="steps">
            <div className="step"><div className="num">1</div><div className="desc">BUY at end of US session</div><div className="time">12:00 AM Dubai / 8 PM UTC</div></div>
            <div className="step"><div className="num">2</div><div className="desc">HOLD for ~6 hours</div><div className="time">Asian session recovery</div></div>
            <div className="step"><div className="num">3</div><div className="desc">SELL at Dubai morning</div><div className="time">6:00 AM Dubai / 2 AM UTC</div></div>
          </div>
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
        <div className="grid-top">
          <div className="card"><div className="card-title">Fed Funds Rate</div><div className="card-value" style={{ fontSize: 28 }}>{macro ? macro.fed_funds_rate + '%' : '--'}</div></div>
          <div className="card"><div className="card-title">Fed Balance Sheet</div><div className="card-value" style={{ fontSize: 28 }}>{macro ? '$' + macro.fed_balance_sheet + 'T' : '--'}</div></div>
          <div className="card"><div className="card-title">Yield Curve (10Y-2Y)</div><div className="card-value" style={{ fontSize: 28, color: macro ? (macro.yield_curve_10y2y >= 0 ? 'var(--green)' : 'var(--red)') : undefined }}>{macro ? macro.yield_curve_10y2y + '%' : '--'}</div></div>
          <div className="card">
            <div className="card-title">Trade Signal</div>
            <div style={{ marginTop: 8 }}>{signal ? <span className={`sb sb-${signal.badge}`}>{signal.label}</span> : <span className="sb sb-neutral">LOADING</span>}</div>
            <div className="card-sub" style={{ marginTop: 8 }}>{signal?.reason ?? '--'}</div>
          </div>
        </div>

        {/* Technicals + M2 chart */}
        <div className="grid-2">
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--blue)' }} /> Technical Indicators</div>
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
                  ['SMA 200', live.sma_200 ? '$' + fmt(live.sma_200) : 'N/A', undefined],
                ].map(([label, value, color]) => (
                  <div className="mr" key={label as string}><span className="mr-l">{label as string}</span><span className="mr-v" style={color ? { color: color as string } : undefined}>{String(value)}</span></div>
                ))}
              </>
            ) : <div className="loading">Loading...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--purple)' }} /> M2 vs BTC (10 Years)</div>
            <div className="chart-wrap"><canvas ref={m2ChartRef} /></div>
          </div>
        </div>

        {/* Strategy performance + equity */}
        <div className="grid-2">
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--green)' }} /> Strategy Performance</div>
            {strategy ? (
              <>
                {[
                  ['Total Trades', strategy.summary.total_trades],
                  ['Win Rate', <span key="wr" style={{ color: strategy.summary.win_rate > 50 ? 'var(--green)' : 'var(--red)' }}>{strategy.summary.win_rate}%</span>],
                  ['W / L', <span key="wl"><span style={{ color: 'var(--green)' }}>{strategy.summary.wins}W</span> / <span style={{ color: 'var(--red)' }}>{strategy.summary.losses}L</span></span>],
                  ['Avg Return/Trade', <span key="ar" style={{ color: pctCol(strategy.summary.avg_return) }}>{pctSign(strategy.summary.avg_return)}</span>],
                  ['Cumulative Return', <span key="cr" style={{ color: pctCol(strategy.summary.cum_return) }}>{pctSign(strategy.summary.cum_return)}</span>],
                  ['Best Trade', <span key="bt" style={{ color: 'var(--green)' }}>+{strategy.summary.max_win}%</span>],
                  ['Worst Trade', <span key="wt" style={{ color: 'var(--red)' }}>{strategy.summary.max_loss}%</span>],
                  ['Annualized Sharpe', strategy.summary.sharpe],
                ].map(([label, value]) => (
                  <div className="mr" key={label as string}><span className="mr-l">{label as string}</span><span className="mr-v">{value as React.ReactNode}</span></div>
                ))}
              </>
            ) : <div className="loading">Loading backtest...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--cyan)' }} /> Equity Curve ($10,000 start)</div>
            <div className="chart-wrap"><canvas ref={equityChartRef} /></div>
          </div>
        </div>

        {/* Day / Month tables */}
        <div className="grid-2">
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--amber)' }} /> By Day of Week</div>
            {strategy ? (
              <table>
                <thead><tr><th>Day</th><th>Trades</th><th>Win Rate</th><th>Avg Return</th><th>Cumulative</th></tr></thead>
                <tbody>
                  {strategy.by_day.map((r: DowStat) => (
                    <tr key={r.day}>
                      <td><strong>{r.day}</strong></td><td>{r.trades}</td>
                      <td style={{ color: r.win_rate > 52 ? 'var(--green)' : r.win_rate < 48 ? 'var(--red)' : 'var(--text)' }}>{r.win_rate}%</td>
                      <td style={{ color: pctCol(r.avg_return) }}>{pctSign(r.avg_return)}</td>
                      <td><div className="bar-w"><div className="bar" style={{ width: Math.min(Math.abs(r.cum_return) * 5, 100), background: pctCol(r.cum_return) }} /><span style={{ color: pctCol(r.cum_return) }}>{pctSign(r.cum_return)}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="loading">Loading...</div>}
          </div>
          <div className="card">
            <div className="sec-title"><span className="dot" style={{ background: 'var(--amber)' }} /> By Month</div>
            {strategy ? (
              <table>
                <thead><tr><th>Month</th><th>Trades</th><th>Win Rate</th><th>Avg Return</th><th>Cumulative</th></tr></thead>
                <tbody>
                  {strategy.by_month.map((r: MonthStat) => (
                    <tr key={r.month}>
                      <td><strong>{r.month}</strong></td><td>{r.trades}</td>
                      <td style={{ color: r.win_rate > 52 ? 'var(--green)' : r.win_rate < 48 ? 'var(--red)' : 'var(--text)' }}>{r.win_rate}%</td>
                      <td style={{ color: pctCol(r.avg_return) }}>{pctSign(r.avg_return)}</td>
                      <td><div className="bar-w"><div className="bar" style={{ width: Math.min(Math.abs(r.cum_return) * 3, 100), background: pctCol(r.cum_return) }} /><span style={{ color: pctCol(r.cum_return) }}>{pctSign(r.cum_return)}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="loading">Loading...</div>}
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

        {/* Recent trades */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="sec-title"><span className="dot" style={{ background: 'var(--blue)' }} /> Recent 30 Trades</div>
          {strategy ? (
            <table>
              <thead><tr><th>Date</th><th>Day</th><th>Buy</th><th>Sell</th><th>Return</th></tr></thead>
              <tbody>
                {[...strategy.recent_trades].reverse().map((t: RecentTrade) => (
                  <tr key={t.date}>
                    <td>{t.date}</td><td>{t.dow}</td>
                    <td>${fmt(t.buy)}</td><td>${fmt(t.sell)}</td>
                    <td style={{ color: pctCol(t.return_pct), fontWeight: 600 }}>{pctSign(t.return_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="loading">Loading...</div>}
        </div>
      </div>
    </>
  );
}
