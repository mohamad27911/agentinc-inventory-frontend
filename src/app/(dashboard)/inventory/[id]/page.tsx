'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Save, X, Loader2, Package, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem, Category, AuditLog, ItemStatus, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

export default function InventoryItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data as Profile);
      }
    };
    fetchProfile();
  }, [supabase]);

  const fetchItem = useCallback(async () => {
    const res = await fetch(`/api/inventory/${id}`);
    if (res.ok) {
      const data = await res.json();
      setItem(data.data);
      setFormData(data.data);
    } else if (res.status === 404) {
      router.push('/inventory');
    }
  }, [id, router]);

  const fetchAuditLogs = useCallback(async () => {
    const res = await fetch(`/api/audit?entity_type=inventory_item&entity_id=${id}&pageSize=50`);
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.data || []);
    }
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const categoriesRes = await fetch('/api/categories');
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData.data || []);
      }
      await fetchItem();
      await fetchAuditLogs();
      setLoading(false);
    };
    fetchAll();
  }, [fetchItem, fetchAuditLogs]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const updates = { ...formData };
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    if (updates.min_quantity !== undefined) updates.min_quantity = Number(updates.min_quantity);
    if (updates.cost_price != null) updates.cost_price = Number(updates.cost_price);
    if (updates.sell_price != null) updates.sell_price = Number(updates.sell_price);

    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (res.ok) {
      setItem(data.data);
      setFormData(data.data);
      setEditing(false);
      fetchAuditLogs();
    } else {
      setError(data.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/inventory');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to delete');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusColors: Record<ItemStatus, string> = {
    in_stock: 'success',
    low_stock: 'warning',
    ordered: 'info',
    discontinued: 'danger',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!item) return null;

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const canDelete = profile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/inventory')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </button>
        <div className="flex items-center gap-3">
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:border-gold/50 hover:text-foreground transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={() => { setEditing(false); setFormData(item); setError(null); }}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-background hover:bg-gold-light disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </>
          )}
          {canDelete && !editing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-danger/30 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gold/10 p-3">
              <Package className="h-8 w-8 text-gold" />
            </div>
            <div>
              {editing ? (
                <input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold bg-input border border-border rounded-lg px-3 py-1 text-foreground focus:border-gold focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
              )}
              <p className="font-mono text-sm text-foreground-muted mt-1">{item.sku}</p>
            </div>
          </div>
          <Badge variant={statusColors[item.status] as 'success' | 'warning' | 'info' | 'danger'}>
            {item.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground-muted mb-2">Description</label>
            {editing ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                rows={2}
              />
            ) : (
              <p className="text-foreground">
                {item.description || <span className="text-foreground-muted">No description</span>}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">SKU</label>
            {editing ? (
              <input
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 font-mono text-foreground focus:border-gold focus:outline-none"
              />
            ) : (
              <p className="font-mono text-foreground">{item.sku}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Category</label>
            {editing ? (
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            ) : (
              item.category ? (
                <Badge color={item.category.color}>{item.category.name}</Badge>
              ) : (
                <span className="text-foreground-muted">—</span>
              )
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Quantity</label>
            {editing ? (
              <input
                type="number"
                min="0"
                value={formData.quantity ?? ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              />
            ) : (
              <p className="text-foreground font-medium">{item.quantity} {item.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Min Quantity (low stock threshold)</label>
            {editing ? (
              <input
                type="number"
                min="0"
                value={formData.min_quantity ?? ''}
                onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              />
            ) : (
              <p className="text-foreground">{item.min_quantity} {item.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Status</label>
            {editing ? (
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="ordered">Ordered</option>
                <option value="discontinued">Discontinued</option>
              </select>
            ) : (
              <Badge variant={statusColors[item.status] as 'success' | 'warning' | 'info' | 'danger'}>
                {item.status.replace('_', ' ')}
              </Badge>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Unit</label>
            {editing ? (
              <select
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="l">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="m">Meters (m)</option>
                <option value="box">Boxes</option>
                <option value="pack">Packs</option>
              </select>
            ) : (
              <p className="text-foreground">{item.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Cost Price</label>
            {editing ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price ?? ''}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                placeholder="0.00"
              />
            ) : (
              <p className="text-foreground">{item.cost_price != null ? `$${item.cost_price.toFixed(2)}` : '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Sell Price</label>
            {editing ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sell_price ?? ''}
                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                placeholder="0.00"
              />
            ) : (
              <p className="text-foreground">{item.sell_price != null ? `$${item.sell_price.toFixed(2)}` : '—'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground-muted mb-2">Location</label>
            {editing ? (
              <input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value || null })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                placeholder="e.g., Shelf A3, Warehouse B"
              />
            ) : (
              <p className="text-foreground">{item.location || <span className="text-foreground-muted">—</span>}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-6 text-sm text-foreground-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Created: {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Updated: {format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>

      {/* Audit History */}
      {auditLogs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            Activity History
          </h2>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between rounded-lg bg-background-tertiary p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 shrink-0">
                    <User className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {log.user?.full_name || 'Unknown user'}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {log.action === 'create' && 'Created this item'}
                      {log.action === 'update' && `Updated: ${Object.keys(log.new_values || {}).join(', ')}`}
                      {log.action === 'delete' && 'Deleted this item'}
                      {log.action === 'status_change' && 'Changed status'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={log.action === 'create' ? 'success' : log.action === 'delete' ? 'danger' : 'default'}>
                    {log.action}
                  </Badge>
                  <p className="text-xs text-foreground-muted mt-1">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Item</h3>
            <p className="text-foreground-muted mb-6">
              Are you sure you want to delete <strong className="text-foreground">{item.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
