import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Profile, UserRole } from '@/types';

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

export function requireRole(
  profile: Profile | null,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  if (!allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createPaginatedQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  page: number,
  pageSize: number
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  return { page, pageSize };
}
