'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Filter, X, Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { InventoryItem, Category, ItemStatus, InventoryFilters, PaginatedResponse } from '@/types';

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [filters, setFilters] = useState<InventoryFilters>({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || undefined,
    status: (searchParams.get('status') as ItemStatus) || undefined,
    sortBy: searchParams.get('sortBy') || 'updated_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('pageSize', pageSize.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const res = await fetch(`/api/inventory?${params.toString()}`);
    if (res.ok) {
      const data: PaginatedResponse<InventoryItem> = await res.json();
      setItems(data.data);
      setTotalItems(data.total);
    }
    setLoading(false);
  }, [currentPage, pageSize, filters]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.data || []);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof InventoryFilters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: undefined,
      status: undefined,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status: ItemStatus): string => {
    const colors: Record<ItemStatus, string> = {
      in_stock: 'success',
      low_stock: 'warning',
      ordered: 'info',
      discontinued: 'danger',
    };
    return colors[status] || 'neutral';
  };

  const hasActiveFilters = filters.search || filters.category_id || filters.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-foreground-muted mt-1">Manage your inventory items</p>
        </div>
        <button
          onClick={() => router.push('/inventory/new')}
          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 font-semibold text-background transition-all hover:bg-gold-light"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border text-foreground-muted hover:border-gold/50 hover:text-foreground'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs text-background">
                  {(filters.search ? 1 : 0) + (filters.category_id ? 1 : 0) + (filters.status ? 1 : 0)}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-foreground-muted hover:text-danger"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
            <div>
              <label className="mb-1.5 block text-sm text-foreground-muted">Category</label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-foreground-muted">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="ordered">Ordered</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-foreground-muted">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="updated_at">Last Updated</option>
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="created_at">Created Date</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-foreground-muted">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-gold focus:outline-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-gold/10 p-4">
              <Search className="h-8 w-8 text-gold" />
            </div>
            <p className="text-lg font-medium text-foreground">No items found</p>
            <p className="text-foreground-muted">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first inventory item'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => router.push('/inventory/new')}
                className="mt-4 flex items-center gap-2 rounded-lg bg-gold px-4 py-2 font-semibold text-background"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background-tertiary">
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Item</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/inventory/${item.id}`)}
                    className="cursor-pointer transition-colors hover:bg-background-tertiary"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.location && (
                          <p className="text-sm text-foreground-muted">{item.location}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-foreground-muted">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.category ? (
                        <Badge color={item.category.color}>{item.category.name}</Badge>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(item.status) as BadgeProps['variant']}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {item.sell_price ? (
                        <span className="text-foreground">${item.sell_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground-muted">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 text-sm text-foreground-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
