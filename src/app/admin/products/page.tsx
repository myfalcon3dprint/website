'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Product } from '@/lib/types';
import { getStoredProducts, saveStoredProducts } from '@/lib/store';
import { 
  Layers, Search, CheckCircle2, AlertCircle, Plus, 
  Minus, ShieldAlert, Sparkles, Tag, Package, RefreshCw,
  ChevronLeft, ChevronRight, Edit3, Trash2, Upload, X, Image as ImageIcon,
  Eye, EyeOff, Copy
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface NewVariantInput {
  id?: string;
  sku: string;
  title: string;
  material: string;
  color: string;
  finish: string;
  priceAdjustmentPaise: number;
  stockQuantity: number;
  leadTimeDays: number;
  image?: string;
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
  const [formFeatures, setFormFeatures] = useState('');
  const [formIncludedItems, setFormIncludedItems] = useState('');
  const [formCareInstructions, setFormCareInstructions] = useState('');
  const [formDispatchInfo, setFormDispatchInfo] = useState('');
  const [formBasePriceINR, setFormBasePriceINR] = useState('499');
  const [formAvailability, setFormAvailability] = useState<'in_stock' | 'made_to_order'>('in_stock');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<NewVariantInput[]>([
    { sku: '', title: 'Matte Black', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0, image: '' },
  ]);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);

  // Inline category creation states
  const [isCreatingInlineCat, setIsCreatingInlineCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatSlug, setInlineCatSlug] = useState('');
  const [inlineCatDesc, setInlineCatDesc] = useState('');
  const [isSubmittingInlineCat, setIsSubmittingInlineCat] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);
  const [categoryJustCreatedNote, setCategoryJustCreatedNote] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
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

  // Media Replacement Handler
  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingImageIndex === null) return;

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
        setFormImages((prev) => {
          const next = [...prev];
          next[replacingImageIndex] = data.publicUrl;
          return next;
        });
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Replacement upload failed');
    } finally {
      setUploadingImage(false);
      setReplacingImageIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Reorder Images
  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormImages((prev) => {
      const next = [...prev];
      const targetIdx = direction === 'left' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Remove Image
  const removeImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormName('');
    setFormSlug('');
    setFormCategoryId(categories[0]?.id || '');
    setFormShortDesc('');
    setFormDesc('');
    setFormFeatures('');
    setFormIncludedItems('');
    setFormCareInstructions('');
    setFormDispatchInfo('');
    setFormBasePriceINR('499');
    setFormAvailability('in_stock');
    setFormIsPublished(true);
    setFormImages([]);
    setFormVariants([
      { id: `temp-${Date.now()}-1`, sku: '', title: 'Matte Black', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0, image: '' },
    ]);
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setUploadError(null);
    setEditError(null);
    setIsCreatingInlineCat(false);
    setCategoryJustCreatedNote(null);
    setInlineCatError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.title);
    setFormSlug(p.slug);
    setFormCategoryId(p.categoryId || '');
    setFormShortDesc(p.subtitle);
    setFormDesc(p.description);
    setFormFeatures((p.features || []).join('\n'));
    setFormIncludedItems((p.includedItems || p.specs?.includedItems || []).join('\n'));
    setFormCareInstructions(p.careInstructions || p.specs?.careInstructions || '');
    setFormDispatchInfo(p.dispatchInfo || p.specs?.dispatchInfo || '');
    setFormBasePriceINR((p.basePricePaise / 100).toString());
    setFormAvailability(p.stockType === 'ready_stock' ? 'in_stock' : 'made_to_order');
    setFormIsPublished(p.isPublished ?? true);
    setFormImages(p.images || []);
    setFormVariants(
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            title: v.title,
            material: v.material || 'PLA',
            color: v.color || 'Standard',
            finish: v.finish || 'Matte (Layered)',
            priceAdjustmentPaise: v.priceAdjustmentPaise || 0,
            stockQuantity: v.stockQuantity ?? 10,
            leadTimeDays: v.leadTimeDays ?? 0,
            image: v.image || '',
          }))
        : [
            { id: `temp-${Date.now()}-1`, sku: `${p.slug.toUpperCase().slice(0, 8)}-1`, title: 'Standard', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0, image: '' },
          ]
    );
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setUploadError(null);
    setEditError(null);
    setIsCreatingInlineCat(false);
    setCategoryJustCreatedNote(null);
    setInlineCatError(null);
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

  // Handle Inline Category Creation
  const handleCreateInlineCategory = async () => {
    if (!inlineCatName.trim()) {
      setInlineCatError('Category name is required');
      return;
    }
    setIsSubmittingInlineCat(true);
    setInlineCatError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inlineCatName.trim(),
          slug: inlineCatSlug.trim() || undefined,
          description: inlineCatDesc.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }
      const newCat = data.category as CategoryItem;
      await fetchCategories();
      setFormCategoryId(newCat.id);
      setIsCreatingInlineCat(false);
      setInlineCatName('');
      setInlineCatSlug('');
      setInlineCatDesc('');
      setCategoryJustCreatedNote(`Category "${newCat.name}" selected! Remember to save this product to persist assignment.`);
    } catch (err: unknown) {
      setInlineCatError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSubmittingInlineCat(false);
    }
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
      const parsedFeatures = formFeatures.split('\n').map((s) => s.trim()).filter(Boolean);
      const parsedIncluded = formIncludedItems.split('\n').map((s) => s.trim()).filter(Boolean);

      const payload = {
        name: formName,
        slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId: formCategoryId || undefined,
        shortDescription: formShortDesc,
        description: formDesc,
        features: parsedFeatures,
        includedItems: parsedIncluded,
        careInstructions: formCareInstructions.trim(),
        dispatchInfo: formDispatchInfo.trim(),
        basePricePaise,
        availability: formAvailability,
        isPublished: formIsPublished,
        images: formImages,
        variants: formVariants.map((v) => ({ ...v, image: v.image || undefined })),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create product');
      }

      const createData = await res.json();
      if (createData?.product) {
        const localCatalog = getStoredProducts();
        saveStoredProducts([createData.product, ...localCatalog]);
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
      const parsedFeatures = formFeatures.split('\n').map((s) => s.trim()).filter(Boolean);
      const parsedIncluded = formIncludedItems.split('\n').map((s) => s.trim()).filter(Boolean);

      const payload = {
        name: formName,
        slug: formSlug,
        categoryId: formCategoryId || null,
        shortDescription: formShortDesc,
        description: formDesc,
        features: parsedFeatures,
        includedItems: parsedIncluded,
        careInstructions: formCareInstructions.trim(),
        dispatchInfo: formDispatchInfo.trim(),
        basePricePaise,
        availability: formAvailability,
        isPublished: formIsPublished,
        images: formImages,
        variants: formVariants.map((v) => ({ ...v, image: v.image || undefined })),
        expectedVersion,
        lastKnownUpdatedAt: versionToUse,
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const conflictData = await res.json().catch(() => ({}));
        setConflictProduct(conflictData.currentProduct || null);
        setConflictMessage(conflictData.error || 'Concurrency conflict: Product was updated by another operator.');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update product (HTTP ${res.status})`);
      }

      const data = await res.json();
      const updated = data.product as Product;
      if (updated) {
        setEditingProduct(updated);
        setFormIsPublished(updated.isPublished ?? true);
        if (updated.categoryId) {
          setFormCategoryId(updated.categoryId);
        }
        if (updated.variants && updated.variants.length > 0) {
          // Replace temporary client IDs with confirmed database IDs
          setFormVariants(
            updated.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              title: v.title,
              material: v.material || 'PLA',
              color: v.color || 'Standard',
              finish: v.finish || 'Matte (Layered)',
              priceAdjustmentPaise: v.priceAdjustmentPaise || 0,
              stockQuantity: v.stockQuantity,
              leadTimeDays: v.leadTimeDays,
              image: v.image || '',
            }))
          );
        }

        // Sync local storage catalog with confirmed database records
        const localCatalog = getStoredProducts();
        const existsInLocal = localCatalog.some((p) => p.id === updated.id);
        const updatedCatalog = existsInLocal
          ? localCatalog.map((p) => (p.id === updated.id ? updated : p))
          : [updated, ...localCatalog];
        saveStoredProducts(updatedCatalog);
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

  // Toggle Live/Archived Publishing State
  const handleTogglePublish = async (p: Product) => {
    if (!canEditCatalog) return;
    try {
      const targetStatus = !p.isPublished;
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: targetStatus,
          expectedVersion: p.version,
          lastKnownUpdatedAt: p.updatedAt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to toggle publishing status');
      }
      const data = await res.json();
      const updatedProduct = data.product || { ...p, isPublished: targetStatus };
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updatedProduct : item)));
      
      const localCatalog = getStoredProducts();
      saveStoredProducts(localCatalog.map((item) => (item.id === p.id ? updatedProduct : item)));

      setStockUpdatedNote(`Product '${p.title}' is now ${targetStatus ? 'Published' : 'Archived'}.`);
    } catch (err: unknown) {
      alert(`Publishing toggle error: ${err instanceof Error ? err.message : 'Failed'}`);
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

      const localCatalog = getStoredProducts();
      saveStoredProducts(localCatalog.map((item) => (item.id === p.id ? { ...item, isPublished: false, archivedAt: new Date().toISOString() } : item)));

      setStockUpdatedNote(`Product '${p.title}' unpublished.`);
      fetchProducts();
    } catch (err: unknown) {
      alert(`Archive error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  // Duplicate Product as Draft
  const handleDuplicateProduct = (p: Product) => {
    setEditingProduct(null);
    setFormName(`${p.title} (Draft Copy)`);
    setFormSlug(`${p.slug}-copy-${Date.now().toString().slice(-4)}`);
    setFormCategoryId(p.categoryId || categories[0]?.id || '');
    setFormShortDesc(p.subtitle);
    setFormDesc(p.description);
    setFormBasePriceINR((p.basePricePaise / 100).toString());
    setFormAvailability(p.stockType === 'ready_stock' ? 'in_stock' : 'made_to_order');
    setFormIsPublished(false); // Created as Draft
    setFormImages(p.images || []);
    setFormVariants(
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            sku: `${v.sku}-COPY`,
            title: v.title,
            material: v.material || 'PLA',
            color: v.color || 'Standard',
            finish: v.finish || 'Matte (Layered)',
            priceAdjustmentPaise: v.priceAdjustmentPaise || 0,
            stockQuantity: v.stockQuantity ?? 10,
            leadTimeDays: v.leadTimeDays ?? 0,
          }))
        : [
            { sku: `${p.slug.toUpperCase().slice(0, 8)}-COPY`, title: 'Standard', material: 'PLA', color: 'Black', finish: 'Matte (Layered)', priceAdjustmentPaise: 0, stockQuantity: 10, leadTimeDays: 0 },
          ]
    );
    setConflictProduct(null);
    setConflictMessage(null);
    setSaveSuccessNote(null);
    setUploadError(null);
    setEditError(null);
    setIsAddModalOpen(true);
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 16px' }}>
            No catalog products matched your filters. Create your first product or adjust category filters.
          </p>
          {canEditCatalog && (
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Create Product
            </button>
          )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        {p.title}
                      </h3>
                      {p.isPublished ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                          Live
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', background: 'rgba(148, 163, 184, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                          Archived
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Base: {formatINR(p.basePricePaise)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {canEditCatalog && (
                    <>
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', color: p.isPublished ? '#10B981' : 'var(--text-secondary)' }}
                        title={p.isPublished ? "Click to archive (unpublish)" : "Click to publish (make live)"}
                      >
                        {p.isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                        title="Edit product"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#60A5FA' }}
                        title="Duplicate as draft copy"
                      >
                        <Copy size={13} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                        Category
                      </label>
                      {canEditCatalog && !isCreatingInlineCat && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingInlineCat(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0 2px',
                          }}
                        >
                          + New Category
                        </button>
                      )}
                    </div>

                    {categoryJustCreatedNote && (
                      <div style={{ padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#10B981', marginBottom: '8px' }}>
                        {categoryJustCreatedNote}
                      </div>
                    )}

                    {isCreatingInlineCat && (
                      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-decor)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>New Category</span>
                          <button
                            type="button"
                            onClick={() => { setIsCreatingInlineCat(false); setInlineCatError(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Category Name (e.g. Desk Accessories)"
                          value={inlineCatName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInlineCatName(val);
                            setInlineCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                          }}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', marginBottom: '6px' }}
                        />
                        <input
                          type="text"
                          placeholder="Category Slug"
                          value={inlineCatSlug}
                          onChange={(e) => setInlineCatSlug(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', marginBottom: '6px' }}
                        />
                        <textarea
                          placeholder="Description (optional)"
                          rows={2}
                          value={inlineCatDesc}
                          onChange={(e) => setInlineCatDesc(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', marginBottom: '8px', resize: 'vertical' }}
                        />
                        {inlineCatError && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '8px' }}>{inlineCatError}</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => { setIsCreatingInlineCat(false); setInlineCatError(null); }}
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingInlineCat || !inlineCatName.trim()}
                            onClick={handleCreateInlineCategory}
                            className="btn btn-primary"
                            style={{ padding: '3px 12px', fontSize: '0.75rem' }}
                          >
                            {isSubmittingInlineCat ? 'Saving...' : 'Create & Select'}
                          </button>
                        </div>
                      </div>
                    )}

                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        setFormCategoryId(e.target.value);
                        setCategoryJustCreatedNote(null);
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Publishing Status
                    </label>
                    <select
                      value={formIsPublished ? 'published' : 'archived'}
                      onChange={(e) => setFormIsPublished(e.target.value === 'published')}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                    >
                      <option value="published">Published (Live on Catalog)</option>
                      <option value="archived">Archived (Draft / Unpublished)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Short Subtitle (Storefront summary near title)
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
                    Full Product Description & Overview
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Key Features & Highlights (One per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formFeatures}
                      placeholder="Micro-drainage channels to prevent root rot&#10;High-infill honeycomb base for stability&#10;Matte faceted exterior"
                      onChange={(e) => setFormFeatures(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      What’s Included (One per line — clarify accessory inclusions)
                    </label>
                    <textarea
                      rows={3}
                      value={formIncludedItems}
                      placeholder="1 × Geometric Origami Planter Base&#10;1 × Matching Drainage Saucer Tray&#10;Note: Succulent plant and potting soil not included."
                      onChange={(e) => setFormIncludedItems(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Care & Handling Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={formCareInstructions}
                      placeholder="Wipe with a clean damp cloth. Hand-wash saucer tray with cool water. Keep away from heat >55°C."
                      onChange={(e) => setFormCareInstructions(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Production & Dispatch Details
                    </label>
                    <textarea
                      rows={2}
                      value={formDispatchInfo}
                      placeholder="Ready stock dispatches in 24 hours from Nashik studio. Made to order printed in 2-4 days."
                      onChange={(e) => setFormDispatchInfo(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-decor)', background: 'var(--surface-raised)', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Media Management: Upload, Preview, Reorder, Replace, Remove */}
                <div style={{ borderTop: '1px solid var(--border-decor)', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Product Media & Studio Photos ({formImages.length})
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <input
                      type="file"
                      ref={replaceFileInputRef}
                      onChange={handleReplaceUpload}
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
                      <Upload size={14} /> {uploadingImage ? 'Uploading...' : 'Upload New Image'}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Click image thumbnail to preview. Use arrows to reorder, ⇄ to replace, × to remove.
                    </span>
                    {uploadError && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                        {uploadError}
                      </span>
                    )}
                  </div>

                  {formImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {formImages.map((img, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div 
                            style={{ 
                              position: 'relative', 
                              width: '72px', 
                              height: '72px', 
                              borderRadius: '4px', 
                              overflow: 'hidden', 
                              border: '1px solid var(--border-decor)', 
                              background: 'var(--surface-raised)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewImageUrl(img)}
                            title="Click to preview enlarged photo"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img}
                              alt={`Photo ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = '0.3';
                              }}
                            />
                            <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '2px' }}>
                              #{idx + 1}
                            </div>
                          </div>
                          {/* Media controls */}
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveImage(idx, 'left')}
                              className="btn btn-outline"
                              style={{ padding: '2px 4px', height: '22px', fontSize: '0.7rem' }}
                              title="Move image left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingImageIndex(idx);
                                replaceFileInputRef.current?.click();
                              }}
                              className="btn btn-outline"
                              style={{ padding: '2px 4px', height: '22px', fontSize: '0.7rem' }}
                              title="Replace image with new file"
                            >
                              ⇄
                            </button>
                            <button
                              type="button"
                              disabled={idx === formImages.length - 1}
                              onClick={() => moveImage(idx, 'right')}
                              className="btn btn-outline"
                              style={{ padding: '2px 4px', height: '22px', fontSize: '0.7rem' }}
                              title="Move image right"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="btn btn-outline"
                              style={{ padding: '2px 4px', height: '22px', fontSize: '0.7rem', color: 'var(--danger)' }}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variant Management Section */}
                <div style={{ borderTop: '1px solid var(--border-decor)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Product Variants & Stock ({formVariants.length})
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Configure unique SKUs, price adjustments, inventory stock, materials, and colors.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = formVariants.length + 1;
                        const slugPrefix = (formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toUpperCase().slice(0, 8);
                        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                        setFormVariants((prev) => [
                          ...prev,
                          {
                            id: tempId,
                            sku: `${slugPrefix}-${nextIdx}`,
                            title: 'Silk White',
                            material: 'PLA',
                            color: 'White',
                            finish: 'Silk Gloss',
                            priceAdjustmentPaise: 0,
                            stockQuantity: 10,
                            leadTimeDays: 0,
                            image: '',
                          },
                        ]);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={12} /> Add Variant
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formVariants.map((v, vIdx) => (
                      <div
                        key={v.id || `v-${vIdx}`}
                        style={{
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border-decor)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr)) 32px',
                          gap: '8px',
                          alignItems: 'end',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            SKU *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.sku}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, sku: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Title
                          </label>
                          <input
                            type="text"
                            value={v.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, title: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Material
                          </label>
                          <select
                            value={v.material}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, material: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          >
                            <option value="PLA">PLA</option>
                            <option value="PETG">PETG</option>
                            <option value="ABS">ABS</option>
                            <option value="Resin">Resin</option>
                            <option value="TPU">TPU (Flexible)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Color
                          </label>
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, color: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Finish
                          </label>
                          <input
                            type="text"
                            value={v.finish}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, finish: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Price Adj (₹)
                          </label>
                          <input
                            type="number"
                            value={(v.priceAdjustmentPaise / 100).toString()}
                            onChange={(e) => {
                              const val = Math.round((parseFloat(e.target.value) || 0) * 100);
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, priceAdjustmentPaise: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Stock Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.stockQuantity.toString()}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, stockQuantity: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Associated Photo
                          </label>
                          <select
                            value={v.image || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) => prev.map((item, i) => i === vIdx ? { ...item, image: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '3px', border: '1px solid var(--border-decor)', background: 'var(--surface-card)', color: 'var(--text-primary)' }}
                          >
                            <option value="">No Image (Generic)</option>
                            {formImages.map((img, i) => (
                              <option key={i} value={img}>Photo #{i + 1} ({img.split('/').pop()?.slice(0, 16)})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <button
                            type="button"
                            disabled={formVariants.length <= 1}
                            onClick={() => setFormVariants((prev) => prev.filter((_, i) => i !== vIdx))}
                            className="btn btn-outline"
                            style={{ padding: '4px', height: '28px', width: '28px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove variant"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Image Full Size Preview Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '800px', 
              maxHeight: '80vh', 
              background: 'var(--surface-card)', 
              border: '1px solid var(--border-decor)', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-decor)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Media Asset Preview</span>
              <button 
                onClick={() => setPreviewImageUrl(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Enlarged media preview"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />
            </div>
            <div style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-raised)', wordBreak: 'break-all' }}>
              {previewImageUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
