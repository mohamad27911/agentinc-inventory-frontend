'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tags, Loader2, X, Save } from 'lucide-react';
import type { Category, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

const PRESET_COLORS = [
  '#c9a84c', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6b7280',
];

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#c9a84c',
  });

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

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#c9a84c' });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '', color: category.color });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }
    setSaving(true);
    setError(null);

    let res: Response;
    if (editingCategory) {
      res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();
    if (res.ok) {
      setShowModal(false);
      fetchCategories();
    } else {
      setError(data.error || 'Failed to save category');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id));
    }
    setDeletingId(null);
    setShowDeleteConfirm(null);
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const canDelete = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-foreground-muted mt-1">Organize your inventory items</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 font-semibold text-background transition-all hover:bg-gold-light"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-gold/10 p-4">
            <Tags className="h-8 w-8 text-gold" />
          </div>
          <p className="text-lg font-medium text-foreground">No categories yet</p>
          <p className="text-foreground-muted">Create categories to organize your inventory</p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="mt-4 flex items-center gap-2 rounded-lg bg-gold px-4 py-2 font-semibold text-background"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: category.color + '22', border: `2px solid ${category.color}55` }}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5">{category.description}</p>
                  )}
                </div>
              </div>

              {(canEdit || canDelete) && (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setShowDeleteConfirm(category.id)}
                      className="flex items-center gap-1.5 text-xs text-danger/70 hover:text-danger transition-colors ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-foreground-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                  placeholder="Category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        outline: formData.color === color ? `3px solid ${color}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: formData.color }} />
                  <p className="text-xs text-foreground-muted">Selected: {formData.color}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 font-semibold text-background hover:bg-gold-light disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Category</h3>
            <p className="text-foreground-muted mb-6">
              Are you sure? Items in this category will lose their category assignment.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deletingId === showDeleteConfirm}
                className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {deletingId === showDeleteConfirm ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
