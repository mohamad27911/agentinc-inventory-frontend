import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api-helpers';
import type { ItemStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize } = getPaginationParams(searchParams);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status') as ItemStatus | null;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('inventory_items')
      .select('*, category:categories(*)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: items, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: items,
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, profile } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const roleError = requireRole(profile, ['admin', 'manager']);
    if (roleError) return roleError;

    const body = await request.json();

    const { name, description, sku, quantity, min_quantity, unit, category_id, status, cost_price, sell_price, location, image_url } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { error: 'Name and SKU are required' },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        name,
        description: description || null,
        sku,
        quantity: quantity ?? 0,
        min_quantity: min_quantity ?? 0,
        unit: unit || 'pcs',
        category_id: category_id || null,
        status: status || 'in_stock',
        cost_price: cost_price ?? null,
        sell_price: sell_price ?? null,
        location: location || null,
        image_url: image_url || null,
        created_by: user.id,
        updated_by: user.id,
      })
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
      p_action: 'create',
      p_entity_type: 'inventory_item',
      p_entity_id: item.id,
      p_old_values: null,
      p_new_values: { name, sku, quantity, status: status || 'in_stock' },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
