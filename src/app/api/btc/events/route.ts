import { NextResponse } from 'next/server';

export const revalidate = 86400;

interface CalEvent {
  date: string;
  type: 'full_moon' | 'new_moon' | 'lunar_eclipse' | 'solar_eclipse' | 'fomc' | 'earnings';
  label: string;
  color: string;
  icon: string;
}

// Full Moons 2024-2026
const FULL_MOONS = [
  '2024-01-25','2024-02-24','2024-03-25','2024-04-23','2024-05-23','2024-06-21',
  '2024-07-21','2024-08-19','2024-09-17','2024-10-17','2024-11-15','2024-12-15',
  '2025-01-13','2025-02-12','2025-03-14','2025-04-13','2025-05-12','2025-06-11',
  '2025-07-10','2025-08-09','2025-09-07','2025-10-07','2025-11-05','2025-12-04',
  '2026-01-03','2026-02-01','2026-03-03','2026-04-01','2026-05-01','2026-05-31',
  '2026-06-29','2026-07-29','2026-08-28','2026-09-26','2026-10-26','2026-11-24','2026-12-23',
];

// New Moons 2024-2026
const NEW_MOONS = [
  '2024-01-11','2024-02-09','2024-03-10','2024-04-08','2024-05-07','2024-06-06',
  '2024-07-05','2024-08-04','2024-09-02','2024-10-02','2024-11-01','2024-12-01','2024-12-30',
  '2025-01-29','2025-02-27','2025-03-29','2025-04-27','2025-05-26','2025-06-25',
  '2025-07-24','2025-08-23','2025-09-21','2025-10-21','2025-11-20','2025-12-19',
  '2026-01-18','2026-02-17','2026-03-18','2026-04-17','2026-05-16','2026-06-15',
  '2026-07-14','2026-08-12','2026-09-11','2026-10-10','2026-11-09','2026-12-09',
];

// Lunar Eclipses 2024-2026
const LUNAR_ECLIPSES: [string, string][] = [
  ['2024-03-25', 'Penumbral'],
  ['2024-09-18', 'Partial'],
  ['2025-03-14', 'Total'],
  ['2025-09-07', 'Total'],
  ['2026-03-03', 'Total'],
  ['2026-08-28', 'Partial'],
];

// Solar Eclipses 2024-2026
const SOLAR_ECLIPSES: [string, string][] = [
  ['2024-04-08', 'Total'],
  ['2024-10-02', 'Annular'],
  ['2025-03-29', 'Partial'],
  ['2025-09-21', 'Partial'],
  ['2026-02-17', 'Annular'],
  ['2026-08-12', 'Total'],
];

// FOMC meetings (decision day = second day) 2024-2026
const FOMC_DATES = [
  '2024-01-31','2024-03-20','2024-05-01','2024-06-12','2024-07-31','2024-09-18','2024-11-07','2024-12-18',
  '2025-01-29','2025-03-19','2025-05-07','2025-06-18','2025-07-30','2025-09-17','2025-10-29','2025-12-10',
  '2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-07-29','2026-09-16','2026-10-28','2026-12-09',
];

// Mag 7 earnings (approximate dates based on historical pattern)
const MAG7_EARNINGS: [string, string][] = [
  // Q4 2023 results (Jan-Feb 2024)
  ['2024-01-25', 'MSFT'], ['2024-01-25', 'TSLA'], ['2024-01-30', 'GOOGL'], ['2024-02-01', 'AMZN'],
  ['2024-02-01', 'AAPL'], ['2024-02-01', 'META'], ['2024-02-21', 'NVDA'],
  // Q1 2024 results (Apr-May 2024)
  ['2024-04-18', 'TSLA'], ['2024-04-25', 'MSFT'], ['2024-04-25', 'GOOGL'], ['2024-04-25', 'META'],
  ['2024-05-02', 'AAPL'], ['2024-05-02', 'AMZN'], ['2024-05-22', 'NVDA'],
  // Q2 2024 results (Jul-Aug 2024)
  ['2024-07-23', 'TSLA'], ['2024-07-23', 'GOOGL'], ['2024-07-30', 'MSFT'],
  ['2024-07-31', 'META'], ['2024-08-01', 'AAPL'], ['2024-08-01', 'AMZN'], ['2024-08-28', 'NVDA'],
  // Q3 2024 results (Oct-Nov 2024)
  ['2024-10-23', 'TSLA'], ['2024-10-29', 'GOOGL'], ['2024-10-30', 'MSFT'],
  ['2024-10-30', 'META'], ['2024-10-31', 'AAPL'], ['2024-10-31', 'AMZN'], ['2024-11-20', 'NVDA'],
  // Q4 2024 results (Jan-Feb 2025)
  ['2025-01-29', 'MSFT'], ['2025-01-29', 'TSLA'], ['2025-01-29', 'META'],
  ['2025-02-04', 'GOOGL'], ['2025-02-06', 'AMZN'], ['2025-02-06', 'AAPL'], ['2025-02-26', 'NVDA'],
  // Q1 2025 results (Apr-May 2025)
  ['2025-04-22', 'TSLA'], ['2025-04-30', 'MSFT'], ['2025-04-30', 'META'],
  ['2025-04-29', 'GOOGL'], ['2025-05-01', 'AMZN'], ['2025-05-01', 'AAPL'], ['2025-05-28', 'NVDA'],
  // Q2 2025 results (Jul-Aug 2025)
  ['2025-07-22', 'TSLA'], ['2025-07-29', 'GOOGL'], ['2025-07-29', 'MSFT'],
  ['2025-07-30', 'META'], ['2025-07-31', 'AAPL'], ['2025-07-31', 'AMZN'], ['2025-08-27', 'NVDA'],
  // Q3 2025 results (Oct-Nov 2025)
  ['2025-10-22', 'TSLA'], ['2025-10-28', 'GOOGL'], ['2025-10-29', 'MSFT'],
  ['2025-10-29', 'META'], ['2025-10-30', 'AAPL'], ['2025-10-30', 'AMZN'], ['2025-11-19', 'NVDA'],
  // Q4 2025 results (Jan-Feb 2026)
  ['2026-01-28', 'MSFT'], ['2026-01-28', 'TSLA'], ['2026-01-28', 'META'],
  ['2026-02-03', 'GOOGL'], ['2026-02-05', 'AMZN'], ['2026-02-05', 'AAPL'], ['2026-02-25', 'NVDA'],
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '2024-01-01';
  const to = searchParams.get('to') || '2027-01-01';

  const events: CalEvent[] = [];

  for (const d of FULL_MOONS) {
    if (d >= from && d <= to) events.push({ date: d, type: 'full_moon', label: 'Full Moon', color: '#fbbf24', icon: '🌕' });
  }
  for (const d of NEW_MOONS) {
    if (d >= from && d <= to) events.push({ date: d, type: 'new_moon', label: 'New Moon', color: '#64748b', icon: '🌑' });
  }
  for (const [d, kind] of LUNAR_ECLIPSES) {
    if (d >= from && d <= to) events.push({ date: d, type: 'lunar_eclipse', label: `Lunar Eclipse (${kind})`, color: '#ef4444', icon: '🌒' });
  }
  for (const [d, kind] of SOLAR_ECLIPSES) {
    if (d >= from && d <= to) events.push({ date: d, type: 'solar_eclipse', label: `Solar Eclipse (${kind})`, color: '#f97316', icon: '☀️' });
  }
  for (const d of FOMC_DATES) {
    if (d >= from && d <= to) events.push({ date: d, type: 'fomc', label: 'FOMC Decision', color: '#3b82f6', icon: '🏛️' });
  }

  const earningsGrouped = new Map<string, string[]>();
  for (const [d, ticker] of MAG7_EARNINGS) {
    if (d >= from && d <= to) {
      const existing = earningsGrouped.get(d);
      if (existing) existing.push(ticker);
      else earningsGrouped.set(d, [ticker]);
    }
  }
  earningsGrouped.forEach((tickers, d) => {
    events.push({ date: d, type: 'earnings', label: tickers.join(', '), color: '#22c55e', icon: '📊' });
  });

  events.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ events, count: events.length });
}
