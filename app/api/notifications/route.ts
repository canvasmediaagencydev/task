import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ notifications: [] }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        related_user:users!notifications_related_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('API: failed to fetch notifications', error);
      return NextResponse.json(
        { notifications: [], error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error('API: unexpected error fetching notifications', error);
    return NextResponse.json(
      { notifications: [], error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
