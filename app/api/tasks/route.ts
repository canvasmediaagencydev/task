import { NextResponse } from 'next/server';
import { fetchTasks } from '@/lib/api';

export async function GET() {
  try {
    const tasks = await fetchTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('API: unexpected error fetching tasks', error);
    return NextResponse.json(
      { tasks: [], error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
