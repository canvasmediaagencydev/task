import { NextResponse } from 'next/server';
import { fetchTasks } from '@/lib/api';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const tasks = await fetchTasks();
    return NextResponse.json({ tasks }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('API: unexpected error fetching tasks', error);
    return NextResponse.json(
      { tasks: [], error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
