import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-helpers';
import type { ForecastData } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return unauthorizedResponse();
    }

    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: snapshots } = await supabase
      .from('stock_snapshots')
      .select('*')
      .eq('item_id', itemId)
      .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    const snapshotData = snapshots || [];

    // Build trend data from snapshots
    const trendData: { date: string; quantity: number; predicted?: number }[] =
      snapshotData.map((s) => ({
        date: s.snapshot_date,
        quantity: s.quantity,
      }));

    let avgDailyConsumption = 0;
    let predictedDaysUntilStockout = Infinity;

    if (snapshotData.length >= 2) {
      // Calculate 7-day moving average of daily consumption
      const dailyChanges: number[] = [];
      for (let i = 1; i < snapshotData.length; i++) {
        const change = snapshotData[i - 1].quantity - snapshotData[i].quantity;
        dailyChanges.push(change);
      }

      // Moving average (up to 7-day window)
      const windowSize = Math.min(7, dailyChanges.length);
      const recentChanges = dailyChanges.slice(-windowSize);
      const movingAvg =
        recentChanges.reduce((sum, c) => sum + c, 0) / recentChanges.length;

      // Linear regression for slope (consumption rate)
      const n = snapshotData.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += snapshotData[i].quantity;
        sumXY += i * snapshotData[i].quantity;
        sumXX += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      // Use the absolute value of negative slope as consumption rate
      // Blend moving average and regression slope
      const regressionConsumption = slope < 0 ? Math.abs(slope) : 0;
      avgDailyConsumption = (movingAvg + regressionConsumption) / 2;

      if (avgDailyConsumption > 0) {
        predictedDaysUntilStockout = Math.floor(
          item.quantity / avgDailyConsumption
        );
      }

      // Predict 14 days into the future
      const lastDate = new Date(snapshotData[snapshotData.length - 1].snapshot_date);
      let projectedQuantity = snapshotData[snapshotData.length - 1].quantity;

      for (let i = 1; i <= 14; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setDate(futureDate.getDate() + i);
        projectedQuantity = Math.max(0, projectedQuantity - avgDailyConsumption);
        trendData.push({
          date: futureDate.toISOString().split('T')[0],
          quantity: Math.round(projectedQuantity),
          predicted: Math.round(projectedQuantity),
        });
      }
    }

    const forecast: ForecastData = {
      itemId: item.id,
      itemName: item.name,
      currentQuantity: item.quantity,
      minQuantity: item.min_quantity,
      avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
      predictedDaysUntilStockout:
        predictedDaysUntilStockout === Infinity
          ? -1
          : predictedDaysUntilStockout,
      reorderSuggested:
        predictedDaysUntilStockout !== Infinity &&
        predictedDaysUntilStockout <= 14,
      trendData,
    };

    return NextResponse.json({ data: forecast });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
