'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AuditLog, PaginatedResponse } from '@/types';
import { format } from 'date-fns';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'status_change', label: 'Status Change' },
] as const;

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'inventory_item', label: 'Inventory Item' },
  { value: 'category', label: 'Category' },
  { value: 'profile', label: 'Profile' },
] as const;

type BadgeVariant = 'success' | 'danger' | 'info' | 'default';

const ACTION_BADGE_MAP: Record<string, BadgeVariant> = {
  create: 'success',
  delete: 'danger',
  status_change: 'info',
  update: 'default',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity_type', entityFilter);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const json: PaginatedResponse<AuditLog> = await res.json();
        setLogs(json.data ?? []);
        setTotalPages(json.totalPages ?? 1);
        setTotal(json.total ?? 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter]);

  const formatEntityType = (type: string) =>
    type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
        <p className="text-foreground-muted mt-1">Track all system activity</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-input-border bg-input px-4 py-2.5 text-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus transition-colors"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-input-border bg-input px-4 py-2.5 text-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus transition-colors"
        >
          {ENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : logs.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-tertiary">
                  <th className="px-6 py-3 text-left font-medium text-foreground-muted">User</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground-muted">Action</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground-muted">Entity</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground-muted">Time</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground-muted">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="border-b border-border hover:bg-background-tertiary/50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold shrink-0">
                            {log.user?.full_name
                              ? log.user.full_name.charAt(0).toUpperCase()
                              : 'S'}
                          </div>
                          <span className="text-foreground">
                            {log.user?.full_name ?? 'System'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <Badge variant={ACTION_BADGE_MAP[log.action] ?? 'default'}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Entity */}
                      <td className="px-6 py-4 text-foreground">
                        {formatEntityType(log.entity_type)}
                        {log.entity_id && (
                          <span className="ml-1 text-foreground-muted">
                            #{log.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-foreground-muted">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4">
                        {log.new_values || log.old_values ? (
                          <button
                            onClick={() =>
                              setExpanded(expanded === log.id ? null : log.id)
                            }
                            className="text-gold hover:text-gold-light text-sm font-medium transition-colors"
                          >
                            {expanded === log.id ? 'Hide diff' : 'Show diff'}
                          </button>
                        ) : (
                          <span className="text-foreground-muted text-sm">--</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Diff Row */}
                    {expanded === log.id && (
                      <tr className="border-b border-border bg-background-tertiary/30">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.old_values && (
                              <div>
                                <p className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                                  Old Values
                                </p>
                                <pre className="rounded-lg bg-background p-4 text-xs text-foreground overflow-x-auto border border-border">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <p className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                                  New Values
                                </p>
                                <pre className="rounded-lg bg-background p-4 text-xs text-foreground overflow-x-auto border border-border">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-foreground-muted">
              {page} / {totalPages} pages
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:bg-background-tertiary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:bg-background-tertiary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
          <FileText className="h-12 w-12 text-foreground-muted mb-4" />
          <p className="text-foreground-muted">No audit logs found</p>
          <p className="text-sm text-foreground-muted mt-1">
            Activity will be recorded here as changes are made
          </p>
        </div>
      )}
    </div>
  );
}
