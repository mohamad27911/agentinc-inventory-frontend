'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { TrendData, ForecastData, InventoryItem } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/analytics/trends');
        if (res.ok) {
          const json = await res.json();
          setTrends(json.data ?? []);
        }
      } catch {
        // silently handle
      } finally {
        setLoadingTrends(false);
      }
    };

    const fetchItems = async () => {
      try {
        const res = await fetch('/api/inventory?pageSize=100');
        if (res.ok) {
          const json = await res.json();
          setItems(json.data ?? []);
        }
      } catch {
        // silently handle
      } finally {
        setLoadingItems(false);
      }
    };

    fetchTrends();
    fetchItems();
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setForecast(null);
      return;
    }

    const fetchForecast = async () => {
      setLoadingForecast(true);
      try {
        const res = await fetch(`/api/analytics/forecast/${selectedItemId}`);
        if (res.ok) {
          const json = await res.json();
          setForecast(json.data ?? null);
        }
      } catch {
        // silently handle
      } finally {
        setLoadingForecast(false);
      }
    };

    fetchForecast();
  }, [selectedItemId]);

  const lowStockItems = items.filter((item) => item.status === 'low_stock');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-foreground-muted mt-1">Stock trends and demand forecasting</p>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="font-medium text-warning">Low Stock Alert</p>
            <p className="text-sm text-foreground-muted">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below minimum
              threshold: {lowStockItems.map((i) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stock Trends Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gold" />
          Stock Trends (Last 30 Days)
        </h2>

        {loadingTrends ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
          </div>
        ) : trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis
                dataKey="date"
                stroke="#a0a0b0"
                tickFormatter={(value: string) => format(new Date(value), 'MMM d')}
                fontSize={12}
              />
              <YAxis stroke="#a0a0b0" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121a',
                  border: '1px solid #2a2a3e',
                  borderRadius: '8px',
                  color: '#e8e8e8',
                }}
                labelFormatter={(value) => format(new Date(String(value)), 'MMM d, yyyy')}
              />
              <Area
                type="monotone"
                dataKey="totalQuantity"
                stroke="#c9a84c"
                strokeWidth={2}
                fill="url(#trendGradient)"
                name="Total Quantity"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-foreground-muted mb-4" />
            <p className="text-foreground-muted">No trend data available</p>
            <p className="text-sm text-foreground-muted mt-1">
              Stock snapshots will appear here once data is recorded
            </p>
          </div>
        )}
      </div>

      {/* Demand Forecast Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-gold" />
          Demand Forecast
        </h2>

        {/* Item Selector */}
        <div className="mb-6">
          <label htmlFor="item-select" className="block text-sm font-medium text-foreground-muted mb-2">
            Select an item to forecast
          </label>
          <select
            id="item-select"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-input-border bg-input px-4 py-2.5 text-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus transition-colors"
          >
            <option value="">-- Choose an item --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>
        </div>

        {loadingForecast ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
          </div>
        ) : forecast ? (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-background-tertiary p-4">
                <p className="text-sm text-foreground-muted">Current Stock</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{forecast.currentQuantity}</p>
              </div>
              <div className="rounded-lg border border-border bg-background-tertiary p-4">
                <p className="text-sm text-foreground-muted">Min Threshold</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{forecast.minQuantity}</p>
              </div>
              <div className="rounded-lg border border-border bg-background-tertiary p-4">
                <p className="text-sm text-foreground-muted">Daily Consumption</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {forecast.avgDailyConsumption.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background-tertiary p-4">
                <p className="text-sm text-foreground-muted">Days Until Stockout</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    forecast.predictedDaysUntilStockout <= 7 ? 'text-danger' : forecast.predictedDaysUntilStockout <= 14 ? 'text-warning' : 'text-success'
                  }`}
                >
                  {forecast.predictedDaysUntilStockout === -1
                    ? 'N/A'
                    : forecast.predictedDaysUntilStockout}
                </p>
              </div>
            </div>

            {/* Reorder Warning */}
            {forecast.reorderSuggested && (
              <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="font-medium text-warning">Reorder Suggested</p>
                  <p className="text-sm text-foreground-muted">
                    Based on current consumption, {forecast.itemName} should be reordered soon to avoid stockout.
                  </p>
                </div>
              </div>
            )}

            {/* Forecast Chart */}
            {forecast.trendData.length > 0 && (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={forecast.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis
                    dataKey="date"
                    stroke="#a0a0b0"
                    tickFormatter={(value: string) => format(new Date(value), 'MMM d')}
                    fontSize={12}
                  />
                  <YAxis stroke="#a0a0b0" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12121a',
                      border: '1px solid #2a2a3e',
                      borderRadius: '8px',
                      color: '#e8e8e8',
                    }}
                    labelFormatter={(value) => format(new Date(String(value)), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <ReferenceLine
                    y={forecast.minQuantity}
                    stroke="#eab308"
                    strokeDasharray="6 3"
                    label={{
                      value: 'Min Threshold',
                      position: 'insideTopRight',
                      fill: '#eab308',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#c9a84c"
                    strokeWidth={2}
                    dot={{ fill: '#c9a84c', r: 3 }}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#3b82f6', r: 3 }}
                    name="Predicted"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-foreground-muted mb-4" />
            <p className="text-foreground-muted">Select an item to view its demand forecast</p>
            <p className="text-sm text-foreground-muted mt-1">
              Choose from the dropdown above to see consumption trends and predictions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
