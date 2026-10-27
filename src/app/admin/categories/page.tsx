'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthUser } from '@/lib/supabase/auth';
import { 
  Tags, Plus, RefreshCw, AlertCircle, CheckCircle2, 
  Edit3, Eye, EyeOff, ArrowUpDown, Save, X, Search, Trash2,
  Sparkles, Bot, Layers, Landmark, Utensils, Compass, Image as ImageIcon
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

const PRESET_IMAGES = [
  { label: 'Planters & Decor', url: '/products/planter-obsidian-black.jpg' },
  { label: 'Miniatures & Collectibles', url: '/products/cyber-gryphon-figure.jpg' },
  { label: 'Architectural Models', url: '/products/trimbakeshwar-temple-model.jpg' },
  { label: 'Desk Accessories', url: '/products/hexagrid-desk-organizer.jpg' },
  { label: 'Kitchen Miniatures', url: '/products/mini-brass-cookware.jpg' },
];

const ICON_OPTIONS = [
  { value: 'Sparkles', label: 'Sparkles (Planters & Decor)' },
  { value: 'Bot', label: 'Bot (Miniatures & Collectibles)' },
  { value: 'Landmark', label: 'Landmark (Architectural Models)' },
  { value: 'Layers', label: 'Layers (Desk Accessories)' },
  { value: 'Utensils', label: 'Utensils (Kitchen Miniatures)' },
  { value: 'Compass', label: 'Compass (Engineering & Prototyping)' },
];

function renderCategoryIcon(iconName?: string | null) {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles size={14} />;
    case 'Bot':
      return <Bot size={14} />;
    case 'Landmark':
      return <Landmark size={14} />;
    case 'Layers':
      return <Layers size={14} />;
    case 'Utensils':
      return <Utensils size={14} />;
    case 'Compass':
    default:
      return <Compass size={14} />;
  }
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
    imageUrl: '',
    icon: 'Sparkles',
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
      imageUrl: '/products/planter-obsidian-black.jpg',
      icon: 'Sparkles',
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
      imageUrl: cat.image_url || '',
      icon: cat.icon || 'Sparkles',
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
      setFormData((prev) => ({ ...prev, name: val, slug: generatedSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
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
            imageUrl: formData.imageUrl.trim() || null,
            icon: formData.icon.trim() || null,
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
            imageUrl: formData.imageUrl.trim() || null,
            icon: formData.icon.trim() || null,
            lastKnownUpdatedAt: editingCategory.updated_at,
          }),
        });
        const data = await res.json();
        if (res.status === 409) {
          throw new Error('Concurrency Conflict: This category was modified in another session. Please refresh.');
        }
        if (!res.ok) throw new Error(data.error || 'Failed to update category');
        setSuccessMsg(`Category '${data.category?.name}' updated with visual appearance.`);
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
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? data.category : c)));
      setSuccessMsg(`Category '${cat.name}' is now ${!cat.is_active ? 'active' : 'inactive'}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Toggle status error');
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (
      !confirm(
        `Are you sure you want to delete category '${cat.name}'?\n\nOrphaning Protection: Products assigned to this category will not be lost. They will be safely reassigned to prevent broken links.`
      )
    ) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      setSuccessMsg(data.message || `Category '${cat.name}' deleted successfully.`);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete category error');
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 2rem' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--brand-accent)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              CATALOG TAXONOMY & APPEARANCE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Category Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Configure studio collections, visual cover images, domain icons, and storefront display priority.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchCategories}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Taxonomy
          </button>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            color: '#F87171',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            color: '#34D399',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
            }}
          />
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> categories
        </div>
      </div>

      {/* Categories Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '0.9rem 1.15rem', width: '70px' }}>Order</th>
                <th style={{ padding: '0.9rem 1.15rem', width: '110px' }}>Visual</th>
                <th style={{ padding: '0.9rem 1.15rem' }}>Name & Slug</th>
                <th style={{ padding: '0.9rem 1.15rem' }}>Description</th>
                <th style={{ padding: '0.9rem 1.15rem', width: '110px' }}>Status</th>
                <th style={{ padding: '0.9rem 1.15rem', textAlign: 'right', width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isLoading ? 'Loading catalog taxonomy...' : 'No categories found.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.9rem 1.15rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowUpDown size={13} />
                        {cat.sort_order}
                      </span>
                    </td>

                    {/* Visual & Icon Column */}
                    <td style={{ padding: '0.9rem 1.15rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-xs)',
                            overflow: 'hidden',
                            background: '#2A2420',
                            position: 'relative',
                            flexShrink: 0,
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {cat.image_url ? (
                            <Image src={cat.image_url} alt={cat.name} fill sizes="40px" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)' }}>
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(255, 113, 0, 0.12)',
                            color: 'var(--brand-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                          title={`Icon: ${cat.icon || 'Compass'}`}
                        >
                          {renderCategoryIcon(cat.icon)}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1.15rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--brand-accent)' }}>/{cat.slug}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.15rem', color: 'var(--text-secondary)', maxWidth: '280px', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {cat.description || '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1.15rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: cat.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                          color: cat.is_active ? '#10B981' : '#94A3B8',
                        }}
                      >
                        {cat.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => toggleCategoryActive(cat)}
                              title={cat.is_active ? 'Deactivate Category' : 'Activate Category'}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              {cat.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => openEditModal(cat)}
                              title="Edit Category Appearance & Settings"
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete Category"
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.55rem', color: '#EF4444' }}
                            >
                              <Trash2 size={13} />
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

      {/* Modal for Create / Edit Category with Visual Appearance Settings */}
      {(isCreating || editingCategory) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {isCreating ? 'Create New Category' : `Edit Category: ${editingCategory?.name}`}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Manage taxonomy and visual card presentation on the storefront.
                </p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
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
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                  placeholder="mechanical-prototypes"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Visual Appearance Section */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--brand-accent)" />
                  Visual Appearance & Icon
                </div>

                {/* Image URL input with thumbnail preview */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Category Cover Image URL
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="/products/planter-obsidian-black.jpg"
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                      }}
                    />
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        background: '#1F1B18',
                        position: 'relative',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {formData.imageUrl ? (
                        <Image src={formData.imageUrl} alt="Preview" fill sizes="44px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preset quick pickers */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                    {PRESET_IMAGES.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, imageUrl: p.url }))}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                          border: formData.imageUrl === p.url ? '1px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                          background: formData.imageUrl === p.url ? 'rgba(255, 113, 0, 0.15)' : 'var(--surface)',
                          color: formData.imageUrl === p.url ? 'var(--brand-accent)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Category Domain Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                    }}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Visible on Storefront
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Architectural models, decor items, and collectibles..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
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
