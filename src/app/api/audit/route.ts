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

    const roleError = requireRole(profile, ['admin', 'manager']);
    if (roleError) return roleError;

    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize } = getPaginationParams(searchParams);
    const entityType = searchParams.get('entity_type');
    const action = searchParams.get('action');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('audit_logs')
      .select('*, user:profiles!audit_logs_user_id_fkey(*)', { count: 'exact' });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: logs,
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
