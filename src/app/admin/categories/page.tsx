'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { 
  Tags, Plus, RefreshCw, AlertCircle, CheckCircle2, 
  Edit3, Eye, EyeOff, ArrowUpDown, Save, X, Search
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCategoriesPage() {
  const { profile } = useAuthUser();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing modal state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = profile?.role === 'owner' || profile?.role === 'catalog_editor';

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories?all=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load categories');
      setCategories(data.categories || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error loading categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      sortOrder: (categories.length + 1) * 10,
      isActive: true,
    });
    setEditingCategory(null);
    setIsCreating(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      sortOrder: cat.sort_order,
      isActive: cat.is_active,
    });
    setEditingCategory(cat);
    setIsCreating(false);
  };

  const closeModal = () => {
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isCreating) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, name: val, slug: generatedSlug }));
    } else {
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isCreating) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            sortOrder: Number(formData.sortOrder) || 0,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create category');
        setSuccessMsg(`Category '${data.category?.name}' created successfully.`);
      } else if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            sortOrder: Number(formData.sortOrder) || 0,
            isActive: formData.isActive,
            lastKnownUpdatedAt: editingCategory.updated_at,
          }),
        });
        const data = await res.json();
        if (res.status === 409) {
          throw new Error('Concurrency Conflict: This category was modified in another session. Please refresh.');
        }
        if (!res.ok) throw new Error(data.error || 'Failed to update category');
        setSuccessMsg(`Category '${data.category?.name}' updated successfully.`);
      }

      closeModal();
      await fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategoryActive = async (cat: CategoryItem) => {
    if (!canEdit) return;
    setError(null);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !cat.is_active,
          lastKnownUpdatedAt: cat.updated_at,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      setCategories(prev => prev.map(c => c.id === cat.id ? data.category : c));
      setSuccessMsg(`Category '${cat.name}' is now ${!cat.is_active ? 'active' : 'inactive'}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Toggle status error');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tags size={28} style={{ color: 'var(--brand-accent)' }} />
            Category Management CMS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
            Organize catalog taxonomy, maintain display sorting, and configure category visibility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchCategories} disabled={isLoading} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canEdit && (
            <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} />
              New Category
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-decor)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <th style={{ padding: '1rem 1.25rem' }}>Sort Order</th>
                <th style={{ padding: '1rem 1.25rem' }}>Category Name</th>
                <th style={{ padding: '1rem 1.25rem' }}>URL Slug</th>
                <th style={{ padding: '1rem 1.25rem' }}>Description</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {isLoading ? 'Loading catalog taxonomy...' : 'No categories found.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-decor)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowUpDown size={14} />
                        {cat.sort_order}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cat.name}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--brand-accent)' }}>
                      /{cat.slug}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {cat.description || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: cat.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        color: cat.is_active ? '#10B981' : '#94A3B8',
                      }}>
                        {cat.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => toggleCategoryActive(cat)}
                              title={cat.is_active ? 'Deactivate Category' : 'Activate Category'}
                              className="btn-outline"
                              style={{ padding: '0.4rem 0.6rem' }}
                            >
                              {cat.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              onClick={() => openEditModal(cat)}
                              title="Edit Category"
                              className="btn-outline"
                              style={{ padding: '0.4rem 0.6rem' }}
                            >
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create / Edit Category */}
      {(isCreating || editingCategory) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {isCreating ? 'Create New Category' : `Edit Category: ${editingCategory?.name}`}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Mechanical Prototypes"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-decor)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                  placeholder="mechanical-prototypes"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-decor)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-decor)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  Lower numerical values appear first in customer storefront navigation.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Functional engineering parts, precision brackets, and gearboxes..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-decor)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={closeModal} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} />
                  {isSubmitting ? 'Saving...' : isCreating ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
