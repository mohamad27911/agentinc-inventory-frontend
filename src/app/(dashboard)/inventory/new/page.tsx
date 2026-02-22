'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Save, Package } from 'lucide-react';
import { Category } from '@/types';

interface FormData {
  name: string;
  description: string;
  sku: string;
  quantity: string;
  min_quantity: string;
  unit: string;
  category_id: string;
  cost_price: string;
  sell_price: string;
  location: string;
  status: string;
}

export default function NewInventoryItemPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sku: '',
    quantity: '0',
    min_quantity: '0',
    unit: 'pcs',
    category_id: '',
    cost_price: '',
    sell_price: '',
    location: '',
    status: 'in_stock',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          sku: formData.sku,
          quantity: parseInt(formData.quantity) || 0,
          min_quantity: parseInt(formData.min_quantity) || 0,
          unit: formData.unit,
          category_id: formData.category_id || null,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          sell_price: formData.sell_price ? parseFloat(formData.sell_price) : null,
          location: formData.location || null,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create item');
        return;
      }

      router.push('/inventory');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gold/10 p-2">
            <Package className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Item</h1>
            <p className="text-foreground-muted">Create a new inventory item</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-danger/10 p-4 text-sm text-danger border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Item name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Item description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                SKU <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="SKU-001"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Quantity <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Min Quantity <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Low stock threshold"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Unit
              </label>
              <select
                value={formData.unit}
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="ordered">Ordered</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Cost Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Sell Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="e.g., Shelf A3, Warehouse B"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 font-semibold text-background transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
