import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
} from '@/lib/api-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    const allowedFields = [
      'name', 'description', 'sku', 'quantity', 'min_quantity',
      'unit', 'category_id', 'status', 'cost_price', 'sell_price',
      'location', 'image_url',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== existing[field as keyof typeof existing]) {
        oldValues[field] = existing[field as keyof typeof existing];
        newValues[field] = body[field];
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: existing });
    }

    updates.updated_by = user.id;
    updates.updated_at = new Date().toISOString();

    const { data: item, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An item with this SKU already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'update',
      p_entity_type: 'inventory_item',
      p_entity_id: id,
      p_old_values: oldValues,
      p_new_values: newValues,
    });

    return NextResponse.json({ data: item });
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
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'delete',
      p_entity_type: 'inventory_item',
      p_entity_id: id,
      p_old_values: { name: existing.name, sku: existing.sku },
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
