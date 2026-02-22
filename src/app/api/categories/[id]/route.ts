import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
} from '@/lib/api-helpers';

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

    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const field of ['name', 'description', 'color']) {
      if (body[field] !== undefined && body[field] !== existing[field as keyof typeof existing]) {
        oldValues[field] = existing[field as keyof typeof existing];
        newValues[field] = body[field];
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: existing });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'update',
      p_entity_type: 'category',
      p_entity_id: id,
      p_old_values: oldValues,
      p_new_values: newValues,
    });

    return NextResponse.json({ data: category });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'delete',
      p_entity_type: 'category',
      p_entity_id: id,
      p_old_values: { name: existing.name },
      p_new_values: null,
    });

    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
