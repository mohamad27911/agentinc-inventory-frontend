'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, AlertTriangle, Tags, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DashboardStats, AuditLog, ItemStatus } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/analytics/overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Items',
      value: stats?.totalItems ?? 0,
      icon: Package,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      label: 'Low Stock',
      value: stats?.lowStockItems ?? 0,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Categories',
      value: stats?.totalCategories ?? 0,
      icon: Tags,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Total Value',
      value: `$${(stats?.totalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      status_change: 'Status Changed',
    };
    return labels[action] || action;
  };

  const getStatusColor = (status: ItemStatus) => {
    const colors: Record<ItemStatus, string> = {
      in_stock: 'success',
      low_stock: 'warning',
      ordered: 'info',
      discontinued: 'danger',
    };
    return colors[status] || 'neutral';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted mt-1">Overview of your inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-6 transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-muted">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className={`rounded-xl ${card.bgColor} p-3`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      {stats?.statusBreakdown && stats.statusBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            Stock Status
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.statusBreakdown.map((item) => (
              <Badge key={item.status} variant={getStatusColor(item.status) as BadgeProps['variant']}>
                {item.status.replace('_', ' ')}: {item.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-gold" />
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((log: AuditLog) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-background-tertiary p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                    <Activity className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {log.entity_type === 'inventory_item' ? 'Inventory Item' : log.entity_type}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {getActionLabel(log.action)} - ID: {log.entity_id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={log.action === 'create' ? 'success' : log.action === 'delete' ? 'danger' : 'default'}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-foreground-muted mb-4" />
            <p className="text-foreground-muted">No recent activity</p>
            <p className="text-sm text-foreground-muted">Create your first inventory item to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
