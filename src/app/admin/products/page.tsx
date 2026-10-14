'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProducts, useStaffRole } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { 
  Layers, Search, CheckCircle2, AlertCircle, Plus, 
  Minus, ShieldAlert, Sparkles, Tag, Package 
} from 'lucide-react';

export default function AdminProductsPage() {
  const { products, updateProductStock } = useProducts();
  const { activeStaff } = useStaffRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockUpdatedNote, setStockUpdatedNote] = useState<string | null>(null);

  const canEditCatalog = ['owner', 'catalog_editor'].includes(activeStaff.role);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
      if (!matchTitle && !matchSku) return false;
    }
    return true;
  });

  const handleStockAdjust = (productId: string, variantId: string, currentStock: number, delta: number) => {
    if (!canEditCatalog) {
      alert(`Access Restricted: Staff role "${activeStaff.role}" cannot adjust catalog inventory stock.`);
      return;
    }
    const newStock = Math.max(0, currentStock + delta);
    updateProductStock(productId, variantId, newStock);
    setStockUpdatedNote(`Inventory adjusted to ${newStock} units by ${activeStaff.name}.`);
    setTimeout(() => setStockUpdatedNote(null), 4000);
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Product Inventory Desk
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Catalog & Stock Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Manage ready-stock quantities, variant specifications, and filament configurations.
        </p>
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

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Filter by Category
          </label>
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Search Product / SKU
          </label>
          <input
            type="text"
            className="input"
            placeholder="Search by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredProducts.map((p) => (
          <div key={p.id} className="card" style={{ padding: '24px' }}>
            {/* Product header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--border-decor)',
                paddingBottom: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface-alt)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-decor)',
                    }}
                  >
                    {p.category}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: p.stockType === 'ready_stock' ? 'var(--success-bg)' : 'var(--surface-alt)',
                      color: p.stockType === 'ready_stock' ? 'var(--success)' : 'var(--text-primary)',
                      border: '1px solid var(--border-decor)',
                    }}
                  >
                    {p.stockType === 'ready_stock' ? 'Ready Stock' : 'Made to Order'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Tech: {p.specs.printTechnology} (Layer: {p.specs.layerHeightMm}mm)
                  </span>
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '4px 0 2px', color: 'var(--text-primary)' }}>{p.title}</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{p.subtitle}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Link
                  href={`/catalog/${p.slug}`}
                  target="_blank"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  View in Storefront ↗
                </Link>
              </div>
            </div>

            {/* Variants & Stock Table */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Configured Variants ({p.variants.length})
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Variant SKU</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Material & Finish</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Price (INR)</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Lead Time</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>In-Stock Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.variants.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-decor)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {v.sku}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            {v.title}
                          </div>
                        </td>

                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {v.material} ({v.color}) • {v.finish}
                        </td>

                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatINR(v.pricePaise)}
                        </td>

                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {v.leadTimeDays === 0 ? 'Same day dispatch' : `${v.leadTimeDays} days`}
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              disabled={!canEditCatalog || v.stockQuantity <= 0}
                              onClick={() => handleStockAdjust(p.id, v.id, v.stockQuantity, -1)}
                              className="btn btn-outline"
                              style={{ padding: '2px 8px', height: '28px', minWidth: '28px', fontSize: '0.75rem' }}
                              title="Decrease stock"
                            >
                              <Minus size={12} />
                            </button>

                            <span
                              style={{
                                minWidth: '32px',
                                textAlign: 'center',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: v.stockQuantity === 0 ? 'var(--danger)' : 'var(--text-primary)',
                              }}
                            >
                              {v.stockQuantity}
                            </span>

                            <button
                              disabled={!canEditCatalog}
                              onClick={() => handleStockAdjust(p.id, v.id, v.stockQuantity, 1)}
                              className="btn btn-outline"
                              style={{ padding: '2px 8px', height: '28px', minWidth: '28px', fontSize: '0.75rem' }}
                              title="Increase stock"
                            >
                              <Plus size={12} />
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
    </div>
  );
}
