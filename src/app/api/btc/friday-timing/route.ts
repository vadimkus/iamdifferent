import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const revalidate = 86400;

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'btc', 'friday_timing_results.json');
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
