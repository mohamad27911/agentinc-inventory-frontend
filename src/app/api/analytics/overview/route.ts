import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-helpers';
import type { DashboardStats, ItemStatus } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const [
      itemsResult,
      lowStockResult,
      categoriesResult,
      valueResult,
      recentActivityResult,
      statusBreakdownResult,
    ] = await Promise.all([
      supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'low_stock'),
      supabase
        .from('categories')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('inventory_items')
        .select('quantity, sell_price'),
      supabase
        .from('audit_logs')
        .select('*, user:profiles!audit_logs_user_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('inventory_items')
        .select('status'),
    ]);

    const totalValue = (valueResult.data || []).reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.sell_price || 0);
    }, 0);

    const statusCounts = new Map<ItemStatus, number>();
    for (const item of statusBreakdownResult.data || []) {
      const current = statusCounts.get(item.status) || 0;
      statusCounts.set(item.status, current + 1);
    }

    const statusBreakdown = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    );

    const stats: DashboardStats = {
      totalItems: itemsResult.count ?? 0,
      lowStockItems: lowStockResult.count ?? 0,
      totalCategories: categoriesResult.count ?? 0,
      totalValue,
      recentActivity: recentActivityResult.data ?? [],
      statusBreakdown,
    };

    return NextResponse.json({ data: stats });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
