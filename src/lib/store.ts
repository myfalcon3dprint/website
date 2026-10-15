'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem, Order, CustomQuoteRequest, OrderStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_QUOTES } from './mock-data';

// Local storage keys
const CART_STORAGE_KEY = 'falcon_cart_v1';
const ORDERS_STORAGE_KEY = 'falcon_orders_v1';
const QUOTES_STORAGE_KEY = 'falcon_quotes_v1';
const PRODUCTS_STORAGE_KEY = 'falcon_products_v2';

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
    return raw ? JSON.parse(raw) : [];
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
    const current = getStoredCart();
    const existingIndex = current.findIndex((item) => item.product.id === product.id && item.variant.id === variant.id);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...current, { id: `${product.id}_${variant.id}`, product, variant, quantity }];
    }
    saveStoredCart(updated);
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
    const updated = current.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item));
    saveStoredCart(updated);
  };

  const removeFromCart = (cartItemId: string) => {
    const current = getStoredCart();
    const updated = current.filter((item) => item.id !== cartItemId);
    saveStoredCart(updated);
  };

  const clearCart = () => {
    saveStoredCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = cart.reduce((sum, item) => sum + item.variant.pricePaise * item.quantity, 0);

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
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
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
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

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
  if (typeof window === 'undefined') return INITIAL_QUOTES;
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_QUOTES;
  } catch {
    return INITIAL_QUOTES;
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
  const [quotes, setQuotes] = useState<CustomQuoteRequest[]>(INITIAL_QUOTES);

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
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed: Product[] = JSON.parse(raw);
    const hasOldImage = parsed.some((p) => p.images[0]?.startsWith('http') || p.variants.some((v) => !v.image && p.id === 'prod-001'));
    if (hasOldImage) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return parsed;
  } catch {
    return INITIAL_PRODUCTS;
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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    setProducts(getStoredProducts());
    const handleSync = () => setProducts(getStoredProducts());
    window.addEventListener(SYNC_EVENT, handleSync);

    // Check for live Supabase database products
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.isLiveDb && Array.isArray(data.products) && data.products.length > 0) {
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


