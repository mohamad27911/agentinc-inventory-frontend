import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-helpers';
import type { TrendData } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: snapshots, error } = await supabase
      .from('stock_snapshots')
      .select('snapshot_date, quantity, item_id')
      .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get current item data for sell_price and min_quantity lookups
    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, sell_price, min_quantity');

    const itemMap = new Map(
      (items || []).map((item) => [item.id, item])
    );

    // Group snapshots by date
    const dateMap = new Map<
      string,
      { totalQuantity: number; totalValue: number; lowStockCount: number }
    >();

    for (const snapshot of snapshots || []) {
      const date = snapshot.snapshot_date;
      const entry = dateMap.get(date) || {
        totalQuantity: 0,
        totalValue: 0,
        lowStockCount: 0,
      };

      const itemInfo = itemMap.get(snapshot.item_id);
      entry.totalQuantity += snapshot.quantity;
      entry.totalValue += snapshot.quantity * (itemInfo?.sell_price || 0);

      if (itemInfo && snapshot.quantity <= itemInfo.min_quantity) {
        entry.lowStockCount += 1;
      }

      dateMap.set(date, entry);
    }

    const trends: TrendData[] = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        totalQuantity: data.totalQuantity,
        totalValue: Math.round(data.totalValue * 100) / 100,
        lowStockCount: data.lowStockCount,
      }));

    return NextResponse.json({ data: trends });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
