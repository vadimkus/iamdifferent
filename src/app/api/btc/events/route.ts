import { NextResponse } from 'next/server';
import {
  FULL_MOONS, NEW_MOONS, LUNAR_ECLIPSES, SOLAR_ECLIPSES,
  FOMC_DATES, MAG7_EARNINGS,
} from '@/lib/market-events';

export const revalidate = 86400;

interface CalEvent {
  date: string;
  type: 'full_moon' | 'new_moon' | 'lunar_eclipse' | 'solar_eclipse' | 'fomc' | 'earnings';
  label: string;
  color: string;
  icon: string;
}

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
