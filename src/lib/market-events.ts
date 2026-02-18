// Full Moons 2024-2026
export const FULL_MOONS = [
  '2024-01-25','2024-02-24','2024-03-25','2024-04-23','2024-05-23','2024-06-21',
  '2024-07-21','2024-08-19','2024-09-17','2024-10-17','2024-11-15','2024-12-15',
  '2025-01-13','2025-02-12','2025-03-14','2025-04-13','2025-05-12','2025-06-11',
  '2025-07-10','2025-08-09','2025-09-07','2025-10-07','2025-11-05','2025-12-04',
  '2026-01-03','2026-02-01','2026-03-03','2026-04-01','2026-05-01','2026-05-31',
  '2026-06-29','2026-07-29','2026-08-28','2026-09-26','2026-10-26','2026-11-24','2026-12-23',
];

// New Moons 2024-2026
export const NEW_MOONS = [
  '2024-01-11','2024-02-09','2024-03-10','2024-04-08','2024-05-07','2024-06-06',
  '2024-07-05','2024-08-04','2024-09-02','2024-10-02','2024-11-01','2024-12-01','2024-12-30',
  '2025-01-29','2025-02-27','2025-03-29','2025-04-27','2025-05-26','2025-06-25',
  '2025-07-24','2025-08-23','2025-09-21','2025-10-21','2025-11-20','2025-12-19',
  '2026-01-18','2026-02-17','2026-03-18','2026-04-17','2026-05-16','2026-06-15',
  '2026-07-14','2026-08-12','2026-09-11','2026-10-10','2026-11-09','2026-12-09',
];

// Lunar Eclipses 2024-2026 [date, type]
export const LUNAR_ECLIPSES: [string, string][] = [
  ['2024-03-25', 'Penumbral'],
  ['2024-09-18', 'Partial'],
  ['2025-03-14', 'Total'],
  ['2025-09-07', 'Total'],
  ['2026-03-03', 'Total'],
  ['2026-08-28', 'Partial'],
];

// Solar Eclipses 2024-2026 [date, type]
export const SOLAR_ECLIPSES: [string, string][] = [
  ['2024-04-08', 'Total'],
  ['2024-10-02', 'Annular'],
  ['2025-03-29', 'Partial'],
  ['2025-09-21', 'Partial'],
  ['2026-02-17', 'Annular'],
  ['2026-08-12', 'Total'],
];

// FOMC decision days (2nd day of each 2-day meeting) 2024-2026
export const FOMC_DATES = [
  '2024-01-31','2024-03-20','2024-05-01','2024-06-12','2024-07-31','2024-09-18','2024-11-07','2024-12-18',
  '2025-01-29','2025-03-19','2025-05-07','2025-06-18','2025-07-30','2025-09-17','2025-10-29','2025-12-10',
  '2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-07-29','2026-09-16','2026-10-28','2026-12-09',
];

// Mag 7 earnings [date, ticker]
export const MAG7_EARNINGS: [string, string][] = [
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

// ---------- Proximity helpers for the recommendation engine ----------

function toMs(d: string) { return new Date(d + 'T00:00:00Z').getTime(); }

function daysUntilNearest(dates: string[], refDate: Date): number {
  const refMs = refDate.getTime();
  let minDays = Infinity;
  for (const d of dates) {
    const diff = Math.abs(toMs(d) - refMs) / 86400_000;
    if (diff < minDays) minDays = diff;
  }
  return Math.round(minDays);
}

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Days until nearest full moon */
export function daysToFullMoon(now = new Date()) { return daysUntilNearest(FULL_MOONS, now); }

/** Days until nearest new moon */
export function daysToNewMoon(now = new Date()) { return daysUntilNearest(NEW_MOONS, now); }

/** Is today +/- 1 day from a lunar or solar eclipse? */
export function nearEclipse(now = new Date()): { near: boolean; label: string | null } {
  const ds = dateStr(now);
  for (const [d, kind] of LUNAR_ECLIPSES) {
    if (Math.abs(toMs(d) - now.getTime()) / 86400_000 <= 1.5) return { near: true, label: `Lunar Eclipse (${kind})` };
  }
  for (const [d, kind] of SOLAR_ECLIPSES) {
    if (Math.abs(toMs(d) - now.getTime()) / 86400_000 <= 1.5) return { near: true, label: `Solar Eclipse (${kind})` };
  }
  return { near: false, label: null };
}

/** Days until the next FOMC decision */
export function daysToNextFOMC(now = new Date()): { days: number; date: string } {
  const refMs = now.getTime();
  let best = { days: 999, date: '' };
  for (const d of FOMC_DATES) {
    const diff = (toMs(d) - refMs) / 86400_000;
    if (diff >= -1 && diff < best.days) best = { days: Math.round(Math.max(0, diff)), date: d };
  }
  return best;
}

/** Is today within +/- 1 day of FOMC decision day? */
export function isFOMCWindow(now = new Date()): boolean {
  return daysToNextFOMC(now).days <= 1;
}

/** Earnings happening today or within +/- 1 day */
export function nearbyEarnings(now = new Date()): string[] {
  const refMs = now.getTime();
  const tickers: string[] = [];
  for (const [d, ticker] of MAG7_EARNINGS) {
    if (Math.abs(toMs(d) - refMs) / 86400_000 <= 1.5 && !tickers.includes(ticker)) {
      tickers.push(ticker);
    }
  }
  return tickers;
}

/** Moon phase label for today */
export function moonPhaseToday(now = new Date()): string {
  const fullDays = daysToFullMoon(now);
  const newDays = daysToNewMoon(now);
  if (fullDays <= 1) return 'Full Moon';
  if (newDays <= 1) return 'New Moon';
  if (fullDays <= 3) return `${fullDays}d to Full Moon`;
  if (newDays <= 3) return `${newDays}d to New Moon`;
  return fullDays < newDays ? `${fullDays}d to Full Moon` : `${newDays}d to New Moon`;
}
