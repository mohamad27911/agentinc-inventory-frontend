import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, profile } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const roleError = requireRole(profile, ['admin']);
    if (roleError) return roleError;

    const { page, pageSize } = getPaginationParams(request.nextUrl.searchParams);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: profiles, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: profiles,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
