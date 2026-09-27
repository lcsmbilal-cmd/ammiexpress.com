import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import OrderSuccessModal from './OrderSuccessModal';
import AdminPanel from './AdminPanel';
import Footer from './Footer';
import { Product, CartItem, OrderDetails } from './types';
import { defaultProducts } from './defaultData';
import { trackStorefrontInitialLoad } from './utils/performanceMonitor';

export default function App() {
  // Store Data States
  const [product, setProduct] = useState<Product>(defaultProducts[0]);
  const [settings, setSettings] = useState<any>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'store' | 'admin'
  const [viewMode, setViewMode] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'store';
  });

  // Admin Auth State
  const [adminUser, setAdminUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ammi_admin_user');
      const token = localStorage.getItem('ammi_admin_token');
      if (stored && token) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Modals and Dynamic States
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDetails | null>(null);

  // Load data from backend API
  const loadStoreData = async () => {
    const apiStartTime = typeof performance !== 'undefined' ? performance.now() : 0;
    let apiDurationMs = 0;
    let apiPayloadSizeBytes = 0;
    try {
      const res = await fetch('/api/store-data');
      if (typeof performance !== 'undefined') {
        apiDurationMs = performance.now() - apiStartTime;
      }
      if (res.ok) {
        const contentLength = res.headers.get('content-length');
        if (contentLength) {
          apiPayloadSizeBytes = parseInt(contentLength, 10);
        }
        const text = await res.text();
        if (!apiPayloadSizeBytes && text) {
          apiPayloadSizeBytes = new Blob([text]).size;
        }

        const data = JSON.parse(text);
        if (data.product) setProduct(data.product);
        if (data.settings) setSettings(data.settings);
        if (data.reviews) setReviews(data.reviews);
        if (data.faqs) setFaqs(data.faqs);
        if (data.categories) setCategories(data.categories);
        if (data.homepageSections) setHomepageSections(data.homepageSections);
      }
    } catch (err) {
      console.warn('Using default store data (API load error or offline):', err);
    } finally {
      setLoading(false);
      trackStorefrontInitialLoad({ apiDurationMs, apiPayloadSizeBytes });
    }
  };

  useEffect(() => {
    loadStoreData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'admin' ? 'store' : 'admin'));
      }
    };

    const handleLocationCheck = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.hash === '#admin') {
        setViewMode('admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('ammi_admin_token');
    localStorage.removeItem('ammi_admin_user');
    setAdminUser(null);
  };

  const handleExitAdmin = () => {
    setViewMode('store');
    loadStoreData();
    if (window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.pathname);
    }
  };

  const handleOpenAdmin = () => {
    setViewMode('admin');
  };

  const scrollToOrderForm = () => {
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (viewMode === 'admin') {
    return (
      <AdminPanel
        onExitToStore={handleExitAdmin}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#F5B800] selection:text-black">
      <Navbar
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={!!adminUser}
      />

      <main>
        <Hero onBuyNowClick={scrollToOrderForm} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductCard
            product={product}
            onBuyNow={scrollToOrderForm}
          />
        </div>
      </main>

      <Footer
        settings={settings}
        isAdminLoggedIn={!!adminUser}
        onOpenAdmin={handleOpenAdmin}
        onBuyNowClick={scrollToOrderForm}
      />
    </div>
  );
}
