import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  unauthorizedResponse,
} from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: categories });
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

    const { name, description, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || null,
        color: color || '#6B7280',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc('log_audit', {
      p_user_id: user.id,
      p_action: 'create',
      p_entity_type: 'category',
      p_entity_id: category.id,
      p_old_values: null,
      p_new_values: { name, color: color || '#6B7280' },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
