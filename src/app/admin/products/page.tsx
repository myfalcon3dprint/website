'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Product } from '@/lib/types';
import { 
  Layers, Search, CheckCircle2, AlertCircle, Plus, 
  Minus, ShieldAlert, Sparkles, Tag, Package, RefreshCw,
  ChevronLeft, ChevronRight, Edit3, Trash2, Upload, X, Image as ImageIcon
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface NewVariantInput {
  sku: string;
  title: string;
  material: string;
  color: string;
  finish: string;
  priceAdjustmentPaise: number;
  stockQuantity: number;
  leadTimeDays: number;
}

export default function AdminProductsPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'customer';
  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Staff';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockUpdatedNote, setStockUpdatedNote] = useState<string | null>(null);
  const [isAdjustingStock, setIsAdjustingStock] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination Controls
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [conflictProduct, setConflictProduct] = useState<Product | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [saveSuccessNote, setSaveSuccessNote] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBasePriceINR, setFormBasePriceINR] = useState('499');
  const [formAvailability, setFormAvailability] = useState<'in_stock' | 'made_to_order'>('in_stock');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<NewVariantInput[]>([
    { sku: '', title: 'Matte Black', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEditCatalog = ['owner', 'catalog_editor'].includes(staffRole);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setProducts(data.products || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.totalCount || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve products';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Stock Adjustment
  const handleStockAdjust = async (productId: string, variantId: string, currentStock: number, delta: number) => {
    if (!canEditCatalog) {
      alert(`Access Restricted: Role '${staffRole}' cannot adjust inventory stock.`);
      return;
    }

    const product = products.find((p) => p.id === productId);
    const newTargetStock = Math.max(0, currentStock + delta);
    setIsAdjustingStock(variantId);

    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          delta,
          expectedVersion: product?.version,
          lastKnownUpdatedAt: product?.updatedAt || '',
        }),
      });

      if (res.status === 409) {
        alert('Concurrency Conflict: Product inventory was modified by another operator. Reloading data.');
        fetchProducts();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update stock');
      }

      const data = await res.json();
      if (data.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? data.product : p)));
      } else {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            return {
              ...p,
              variants: p.variants.map((v) => (v.id === variantId ? { ...v, stockQuantity: newTargetStock } : v)),
            };
          })
        );
      }

      setStockUpdatedNote(`Inventory committed to PostgreSQL: ${newTargetStock} units by ${staffName}.`);
      setTimeout(() => setStockUpdatedNote(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock update failed';
      alert(`Error updating stock: ${msg}`);
    } finally {
      setIsAdjustingStock(null);
    }
  };

  // Media Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'products');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      if (data.uploadUrl) {
        const directUploadRes = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'image/jpeg' },
        });
        if (!directUploadRes.ok) {
          throw new Error(`Direct storage upload failed with status ${directUploadRes.status}`);
        }
      }

      if (data.publicUrl) {
        setFormImages((prev) => [...prev, data.publicUrl]);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormName('');
    setFormSlug('');
    setFormCategoryId(categories[0]?.id || '');
    setFormShortDesc('');
    setFormDesc('');
    setFormBasePriceINR('499');
    setFormAvailability('in_stock');
    setFormImages([]);
    setFormVariants([
      { sku: '', title: 'Matte Black', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0 },
    ]);
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setUploadError(null);
    setEditError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.title);
    setFormSlug(p.slug);
    setFormCategoryId('');
    setFormShortDesc(p.subtitle);
    setFormDesc(p.description);
    setFormBasePriceINR((p.basePricePaise / 100).toString());
    setFormAvailability(p.stockType === 'ready_stock' ? 'in_stock' : 'made_to_order');
    setFormImages(p.images || []);
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setUploadError(null);
    setEditError(null);
  };

  // Conflict Resolution: Review server changes and explicitly bind reviewed version token for conditional retry
  const handleReviewAndConfirmOverwrite = async () => {
    if (!conflictProduct || !editingProduct) return;
    const reviewedVersion = conflictProduct.updatedAt;
    const reviewedIntVersion = conflictProduct.version;
    setEditingProduct({
      ...editingProduct,
      updatedAt: reviewedVersion,
      version: reviewedIntVersion,
    });
    setConflictProduct(null);
    setConflictMessage(null);
    await handleUpdateProduct(undefined, reviewedVersion, reviewedIntVersion);
  };

  // Conflict Resolution: Discard user's unsaved form input and adopt latest server version
  const handleAdoptServerVersion = () => {
    if (!conflictProduct) return;
    setEditingProduct(conflictProduct);
    setFormName(conflictProduct.title);
    setFormSlug(conflictProduct.slug);
    setFormShortDesc(conflictProduct.subtitle);
    setFormDesc(conflictProduct.description);
    setFormBasePriceINR((conflictProduct.basePricePaise / 100).toString());
    setFormAvailability(conflictProduct.stockType === 'ready_stock' ? 'in_stock' : 'made_to_order');
    setFormImages(conflictProduct.images || []);
    setConflictProduct(null);
    setConflictMessage(null);
  };

  // Save New Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setEditError('Product name is required');
      return;
    }

    setIsSubmitting(true);
    setEditError(null);
    try {
      const basePricePaise = Math.round(parseFloat(formBasePriceINR) * 100);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categoryId: formCategoryId || undefined,
          shortDescription: formShortDesc,
          description: formDesc,
          basePricePaise,
          availability: formAvailability,
          images: formImages,
          variants: formVariants,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create product');
      }

      setIsAddModalOpen(false);
      setStockUpdatedNote(`Product '${formName}' created successfully.`);
      fetchProducts();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edited Product
  const handleUpdateProduct = async (e?: React.FormEvent, overrideUpdatedAt?: string, overrideVersion?: number) => {
    if (e) e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setEditError(null);

    try {
      const basePricePaise = Math.round(parseFloat(formBasePriceINR) * 100);
      const versionToUse = overrideUpdatedAt || editingProduct.updatedAt || '';
      const expectedVersion = overrideVersion !== undefined ? overrideVersion : editingProduct.version;
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          shortDescription: formShortDesc,
          description: formDesc,
          basePricePaise,
          availability: formAvailability,
          images: formImages,
          expectedVersion,
          lastKnownUpdatedAt: versionToUse,
        }),
      });

      if (res.status === 409) {
        const conflictData = await res.json().catch(() => ({}));
        setConflictProduct(conflictData.currentProduct || null);
        setConflictMessage(conflictData.error || 'Concurrency conflict: Product was updated by another operator.');
        // Unsaved inputs are preserved in form fields!
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Update failed with status ${res.status}`);
      }

      const data = await res.json();
      const updated = data.product as Product;

      if (updated) {
        // Refresh editingProduct version in memory so sequential saves succeed without reload
        setEditingProduct(updated);
        // Refresh catalog list in memory
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }

      setSaveSuccessNote(`Saved at ${new Date().toLocaleTimeString()}`);
      setStockUpdatedNote(`Product '${formName}' updated successfully.`);
      fetchProducts();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archive / Soft Delete
  const handleArchiveProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to unpublish and archive '${p.title}'?`)) return;

    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to archive');
      }
      setStockUpdatedNote(`Product '${p.title}' unpublished.`);
      fetchProducts();
    } catch (err: unknown) {
      alert(`Archive error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Product Catalog & Inventory Desk
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Catalog & Stock Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Authoritative inventory adjustment, variant configurations, and live database persistence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canEditCatalog && (
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> New Product
            </button>
          )}

          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {stockUpdatedNote && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={16} /> {stockUpdatedNote}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={16} /> Error: {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-decor)',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by product title or SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-decor)',
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tag size={15} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-decor)',
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading live database products...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface-card)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-decor)' }}>
          <Package size={36} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No products found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            No catalog products matched your filters. Create a new product or check active categories.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-decor)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Product Card Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-decor)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-decor)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {p.images && p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                      {p.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '2px 0 2px', color: 'var(--text-primary)' }}>
                      {p.title}
                    </h3>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Base: {formatINR(p.basePricePaise)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {canEditCatalog && (
                    <>
                      <button
                        onClick={() => openEditModal(p)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                        title="Edit product"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleArchiveProduct(p)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                        title="Archive product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Variants & Inventory */}
              <div style={{ padding: '16px 20px', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  Configured Variants ({p.variants.length})
                </span>

                <div style={{ marginTop: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-decor)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 0' }}>Variant</th>
                        <th style={{ padding: '6px 0' }}>SKU</th>
                        <th style={{ padding: '6px 0', textAlign: 'right' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.variants.map((v) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>
                            {v.material} / {v.color}
                          </td>
                          <td style={{ padding: '8px 0', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {v.sku}
                          </td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                disabled={!canEditCatalog || isAdjustingStock === v.id || v.stockQuantity <= 0}
                                onClick={() => handleStockAdjust(p.id, v.id, v.stockQuantity, -1)}
                                className="btn btn-outline"
                                style={{ padding: '2px 6px', height: '24px', minWidth: '24px', fontSize: '0.75rem' }}
                                title="Decrease stock"
                              >
                                <Minus size={10} />
                              </button>

                              <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: v.stockQuantity === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                                {isAdjustingStock === v.id ? '...' : v.stockQuantity}
                              </span>

                              <button
                                disabled={!canEditCatalog || isAdjustingStock === v.id}
                                onClick={() => handleStockAdjust(p.id, v.id, v.stockQuantity, 1)}
                                className="btn btn-outline"
                                style={{ padding: '2px 6px', height: '24px', minWidth: '24px', fontSize: '0.75rem' }}
                                title="Increase stock"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '16px 20px',
            marginTop: '24px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-decor)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} catalog products)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {(isAddModalOpen || editingProduct) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-decor)',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Create New Product'}
              </h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Inline Concurrency Conflict Banner */}
            {conflictMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>
                  <ShieldAlert size={18} />
                  <span>Concurrency Conflict Detected</span>
                </div>
                <p style={{ margin: '6px 0 10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Another operator or session modified this product. Your unsaved modifications are preserved below so you do not lose your work.
                </p>
                {conflictProduct && (
                  <div style={{ background: 'var(--surface-raised)', borderRadius: '4px', padding: '10px 12px', fontSize: '0.75rem', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Review Conflicting Changes (Server vs. Your Unsaved Inputs):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '3px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>LATEST IN DATABASE:</div>
                        <div><strong>Title:</strong> {conflictProduct.title}</div>
                        <div><strong>Subtitle:</strong> {conflictProduct.subtitle}</div>
                        <div><strong>Price:</strong> {formatINR(conflictProduct.basePricePaise)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '3px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>YOUR UNSAVED INPUTS:</div>
                        <div><strong>Title:</strong> {formName}</div>
                        <div><strong>Subtitle:</strong> {formShortDesc}</div>
                        <div><strong>Price:</strong> ₹{formBasePriceINR}</div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      Reviewed Database Version Token: <code style={{ color: 'var(--accent-orange)' }}>v{conflictProduct.version ?? 1} ({conflictProduct.updatedAt})</code>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleReviewAndConfirmOverwrite}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Use reviewed version and retry
                  </button>
                  <button
                    type="button"
                    onClick={handleAdoptServerVersion}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Adopt Server Version
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConflictProduct(null); setConflictMessage(null); }}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Keep Form Open
                  </button>
                </div>
              </div>
            )}

            {/* Success Note */}
            {saveSuccessNote && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: '16px',
                color: '#22c55e',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}>
                <CheckCircle2 size={16} />
                <span>Changes saved successfully ({saveSuccessNote}). Ready for next edit.</span>
              </div>
            )}

            {/* Error Message */}
            {editError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '0.8125rem',
              }}>
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formBasePriceINR}
                      onChange={(e) => setFormBasePriceINR(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Availability
                    </label>
                    <select
                      value={formAvailability}
                      onChange={(e) => setFormAvailability(e.target.value as 'in_stock' | 'made_to_order')}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                    >
                      <option value="in_stock">Ready In Stock</option>
                      <option value="made_to_order">Made to Order</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Short Subtitle
                  </label>
                  <input
                    type="text"
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Product Media & Studio Photos
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formImages.length} image(s) attached
                    </span>
                    {uploadError && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                        {uploadError}
                      </span>
                    )}
                  </div>

                  {formImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {formImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt="Product"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.opacity = '0.3';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px' }}
                  >
                    {editingProduct ? 'Done' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px' }}
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
