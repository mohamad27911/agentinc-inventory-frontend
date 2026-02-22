import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import type { UserRole } from '@/types';

const VALID_ROLES: UserRole[] = ['admin', 'manager', 'viewer'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, profile } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const roleError = requireRole(profile, ['admin']);
    if (roleError) return roleError;

    const { role } = await request.json();

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = targetProfile.role;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'update',
      p_entity_type: 'profile',
      p_entity_id: id,
      p_old_values: { role: oldRole },
      p_new_values: { role },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
