import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import type { ItemStatus } from '@/types';

const VALID_STATUSES: ItemStatus[] = ['in_stock', 'low_stock', 'ordered', 'discontinued'];

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

    const roleError = requireRole(profile, ['admin', 'manager']);
    if (roleError) return roleError;

    const { status } = await request.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const oldStatus = existing.status;

    const { data: item, error } = await supabase
      .from('inventory_items')
      .update({
        status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'status_change',
      p_entity_type: 'inventory_item',
      p_entity_id: id,
      p_old_values: { status: oldStatus },
      p_new_values: { status },
    });

    return NextResponse.json({ data: item });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
