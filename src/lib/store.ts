'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem, Order, CustomQuoteRequest, OrderStatus } from './types';

// Local storage keys
const CART_STORAGE_KEY = 'falcon_cart_v2';
const ORDERS_STORAGE_KEY = 'falcon_orders_v1';
const QUOTES_STORAGE_KEY = 'falcon_quotes_v1';
const PRODUCTS_STORAGE_KEY = 'falcon_products_v3';

// Custom events for cross-component reactive updates
const SYNC_EVENT = 'falcon_store_sync';
export const OPEN_CART_EVENT = 'falcon_open_cart';

export function notifyStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SYNC_EVENT));
  }
}

export function openCartDrawer() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_CART_EVENT));
  }
}

// ----------------------------------------------------
// Cart Store
// ----------------------------------------------------
export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const catalog = getStoredProducts();
    const sanitized: CartItem[] = [];

    for (const rawItem of parsed) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const item = rawItem as Partial<CartItem>;
      const product = catalog.find((p) => p.id === item.product?.id) || item.product;
      if (!product || !product.id) continue;

      const matchingVariant = product.variants?.find((v) => v.id === item.variant?.id);
      const qty = typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1;

      if (!matchingVariant || matchingVariant.id === 'unresolved') {
        sanitized.push({
          id: item.id || `${product.id}_unresolved`,
          product,
          variant: {
            id: 'unresolved',
            sku: 'UNKNOWN',
            title: 'Variant configuration unavailable — Please re-select',
            material: 'PLA',
            color: 'Unknown',
            finish: 'Raw (Layered)',
            pricePaise: product.basePricePaise || 0,
            dimensions: { lengthMm: 0, widthMm: 0, heightMm: 0 },
            weightGrams: 0,
            stockQuantity: 0,
            leadTimeDays: 0,
          },
          quantity: qty,
          needsReselection: true,
        });
        continue;
      }

      const stableId = `${product.id}_${matchingVariant.id}`;
      sanitized.push({
        id: stableId,
        product: { ...product },
        variant: { ...matchingVariant },
        quantity: qty,
        needsReselection: false,
      });
    }

    return sanitized;
  } catch {
    return [];
  }
}

export function saveStoredCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCart(getStoredCart());
    setIsLoaded(true);

    const handleSync = () => setCart(getStoredCart());
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const addToCart = (product: Product, variantId: string, quantity = 1, openDrawer = true) => {
    const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    const stableId = `${product.id}_${variant.id}`;
    const current = getStoredCart();
    const existingIndex = current.findIndex((item) => item.id === stableId);

    const maxStock = variant.leadTimeDays === 0 ? Math.max(0, variant.stockQuantity) : 99;
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = current.map((item, idx) => {
        if (idx === existingIndex) {
          const nextQty = Math.min(item.quantity + quantity, maxStock);
          return {
            ...item,
            quantity: nextQty,
            variant: { ...variant },
            product: { ...product },
          };
        }
        return item;
      });
    } else {
      const initialQty = Math.min(Math.max(1, quantity), maxStock);
      updated = [
        ...current,
        {
          id: stableId,
          product: { ...product },
          variant: { ...variant },
          quantity: initialQty,
          needsReselection: false,
        },
      ];
    }

    saveStoredCart(updated);
    setCart(updated);
    if (openDrawer) {
      openCartDrawer();
    }
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    const current = getStoredCart();
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const updated = current.map((item) => {
      if (item.id !== cartItemId) return item;
      const maxStock = item.variant.leadTimeDays === 0 ? Math.max(0, item.variant.stockQuantity) : 99;
      const clampedQty = Math.min(newQty, maxStock);
      return { ...item, quantity: clampedQty };
    });

    saveStoredCart(updated);
    setCart(updated);
  };

  const removeFromCart = (cartItemId: string) => {
    const current = getStoredCart();
    const updated = current.filter((item) => item.id !== cartItemId);
    saveStoredCart(updated);
    setCart(updated);
  };

  const clearCart = () => {
    saveStoredCart([]);
    setCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + (item.needsReselection ? 0 : item.quantity), 0);
  const subtotalPaise = cart.reduce(
    (sum, item) => sum + (item.needsReselection ? 0 : item.variant.pricePaise * item.quantity),
    0
  );

  return {
    cart,
    isLoaded,
    itemCount,
    subtotalPaise,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openDrawer: openCartDrawer,
  };
}

// ----------------------------------------------------
// Orders Store
// ----------------------------------------------------
export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to save orders to localStorage', err);
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
    const handleSync = () => setOrders(getStoredOrders());
    window.addEventListener(SYNC_EVENT, handleSync);

    // Attempt live fetch from database
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.isLiveDb && Array.isArray(data.orders) && data.orders.length > 0) {
          // Merge with any local orders
          const local = getStoredOrders();
          const merged = [...local];
          data.orders.forEach((dbOrd: Order) => {
            if (!merged.some((m) => m.orderNumber === dbOrd.orderNumber)) {
              merged.push(dbOrd);
            }
          });
          saveStoredOrders(merged);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const addOrder = (order: Order) => {
    const current = getStoredOrders();
    const updated = [order, ...current];
    saveStoredOrders(updated);

    // Sync to backend API / Supabase
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch((err) => console.warn('Order sync warning:', err));
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note = '') => {
    const current = getStoredOrders();
    const targetOrder = current.find((o) => o.id === orderId);

    const updated = current.map((ord) => {
      if (ord.id !== orderId) return ord;
      const newHistory = [
        ...ord.statusHistory,
        { status: newStatus, timestamp: new Date().toISOString(), note: note || `Status updated to ${newStatus}` },
      ];
      return { ...ord, status: newStatus, statusHistory: newHistory };
    });
    saveStoredOrders(updated);

    // Sync to backend API if order exists
    if (orderId && !orderId.startsWith('ord-mock-')) {
      fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          statusNote: note,
          lastKnownUpdatedAt: targetOrder?.updatedAt,
        }),
      }).catch((err) => console.warn('Order status backend sync notice:', err));
    }
  };

  const updateShippingAddress = (orderId: string, newAddress: Order['shippingAddress']) => {
    const current = getStoredOrders();
    const targetOrder = current.find((o) => o.id === orderId);

    const updated = current.map((ord) => {
      if (ord.id !== orderId) return ord;
      return { ...ord, shippingAddress: newAddress };
    });
    saveStoredOrders(updated);

    // Sync to backend API
    if (orderId && !orderId.startsWith('ord-mock-')) {
      fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: newAddress,
          lastKnownUpdatedAt: targetOrder?.updatedAt,
        }),
      }).catch((err) => console.warn('Address update backend sync notice:', err));
    }
  };

  return { orders, addOrder, updateOrderStatus, updateShippingAddress };
}

// ----------------------------------------------------
// Quotes Store
// ----------------------------------------------------
export function getStoredQuotes(): CustomQuoteRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredQuotes(quotes: CustomQuoteRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to save quotes', err);
  }
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<CustomQuoteRequest[]>([]);

  useEffect(() => {
    setQuotes(getStoredQuotes());
    const handleSync = () => setQuotes(getStoredQuotes());
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const addQuote = (quote: CustomQuoteRequest) => {
    const current = getStoredQuotes();
    const updated = [quote, ...current];
    saveStoredQuotes(updated);

    // Sync to backend API / Supabase
    fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote),
    }).catch((err) => console.warn('Quote sync warning:', err));
  };

  const updateQuotePrice = (quoteId: string, pricePaise: number, leadDays: number, notes?: string) => {
    const current = getStoredQuotes();
    const updated = current.map((q) => {
      if (q.id !== quoteId) return q;
      return {
        ...q,
        status: 'quoted' as const,
        quotedPricePaise: pricePaise,
        estimatedLeadDays: leadDays,
        adminNotes: notes || q.adminNotes,
      };
    });
    saveStoredQuotes(updated);
  };

  return { quotes, addQuote, updateQuotePrice };
}

// ----------------------------------------------------
// Products Store
// ----------------------------------------------------
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Product[];
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to save products', err);
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(getStoredProducts());
    const handleSync = () => setProducts(getStoredProducts());
    window.addEventListener(SYNC_EVENT, handleSync);

    // Check for live Supabase database products
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.isLiveDb && Array.isArray(data.products)) {
          saveStoredProducts(data.products);
          setProducts(data.products);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const updateProductStock = (productId: string, variantId: string, newStock: number) => {
    const current = getStoredProducts();
    const updated = current.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        variants: p.variants.map((v) => (v.id === variantId ? { ...v, stockQuantity: newStock } : v)),
      };
    });
    saveStoredProducts(updated);
  };

  return { products, updateProductStock };
}

// ----------------------------------------------------
// Recently Viewed Products Store
// ----------------------------------------------------
const RECENTLY_VIEWED_KEY = 'falcon_recently_viewed_v1';

export function getRecentlyViewedSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewedSlug(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const existing = getRecentlyViewedSlugs();
    const updated = [slug, ...existing.filter((s) => s !== slug)].slice(0, 8);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    notifyStoreUpdate();
  } catch {
    // Graceful fallback if storage quota exceeded or disabled
  }
}

export function useRecentlyViewed() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const { products } = useProducts();

  useEffect(() => {
    setSlugs(getRecentlyViewedSlugs());
    const handleSync = () => setSlugs(getRecentlyViewedSlugs());
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const recentlyViewedProducts = slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p));

  return { recentlyViewedProducts, addRecentlyViewedSlug };
}



