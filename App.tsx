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
import { OrderForm } from './components/OrderForm';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';

// Admin System Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { trackStorefrontInitialLoad } from './utils/performanceMonitor';

export default function App() {
  // Store Data States
  const [product, setProduct] = useState<Product>(defaultProduct);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [reviews, setReviews] = useState<CustomerReview[]>(defaultReviews);
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFAQs);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
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
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
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
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [stickyVisible, setStickyVisible] = useState(true);

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
      // Track and log storefront initial load metrics including image timings and API payload size
      trackStorefrontInitialLoad({ apiDurationMs, apiPayloadSizeBytes });
    }
  };

  useEffect(() => {
    loadStoreData();

    // Owner shortcut: Ctrl+Shift+A or Cmd+Shift+A secretly toggles admin mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'admin' ? 'store' : 'admin'));
      }
    };

    // Watch for URL hash changes (#admin) or history state
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

  // Admin logout handler
  const handleAdminLogout = () => {
    localStorage.removeItem('ammi_admin_token');
    localStorage.removeItem('ammi_admin_user');
    setAdminUser(null);
  };

  // Exit Admin to Storefront
  const handleExitAdmin = () => {
    setViewMode('store');
    // Refresh storefront data when switching back to store
    loadStoreData();
    if (window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.pathname);
    }
  };

  // Switch to Admin
  const handleOpenAdmin = () => {
    setViewMode('admin');
  };

  // Smooth scroll helper to order form
  const scrollToOrderForm = () => {
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Review submission handler
  const handleNewReview = async (newReview: {
    name: string;
    city: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [data.review, ...prev]);
      }
    } catch (err) {
      console.error('Error posting review:', err);
      const fallback: CustomerReview = {
        id: 'rev-' + Date.now(),
        name: newReview.name,
        city: newReview.city,
        rating: newReview.rating,
        comment: newReview.comment,
        date: 'Just now',
        verifiedPurchase: true,
        approved: true
      };
      setReviews((prev) => [fallback, ...prev]);
    }
  };

  // IF ADMIN VIEW MODE IS ACTIVE:
  if (viewMode === 'admin') {
    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={(user) => {
            setAdminUser(user);
          }}
          onBackToStore={handleExitAdmin}
        />
      );
    }

    return (
      <AdminDashboard
        user={adminUser}
        onLogout={handleAdminLogout}
        onExitToStore={handleExitAdmin}
        onProductChanged={(newProd) => setProduct(newProd)}
      />
    );
  }

  // CUSTOMER STOREFRONT VIEW:
  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#F5B800] selection:text-black">
      
      {/* 1. Announcement Bar */}
      <AnnouncementBar
        text={settings?.announcementBar?.text || '🚚 Fast Delivery All Over Pakistan | 💵 Cash on Delivery Available'}
        linkText={settings?.announcementBar?.linkText || 'Order Now'}
        onActionClick={scrollToOrderForm}
        enabled={settings?.announcementBar?.enabled ?? true}
      />

      {/* 2. Sticky Header */}
      <Header
        logoUrl={settings?.logoUrl}
        logoHeight={settings?.logoHeight}
        logoText={settings?.logoText}
        whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
        whatsappPrefilledMessage={settings?.whatsappPrefilledMessage || 'Assalam-o-Alaikum Ammi Express, I need information about {product}.'}
        productTitle={product?.title || 'Ammi Express Smart Chopper'}
        isAdminLoggedIn={!!adminUser}
        socialLinks={settings?.socialLinks}
        supportEmail={settings?.supportEmail}
        onBuyNowClick={scrollToOrderForm}
        onOpenAdmin={handleOpenAdmin}
      />

      <main>
        {homepageSections && homepageSections.length > 0 ? (
          [...homepageSections]
            .filter((s) => s.enabled !== false)
            .sort((a, b) => a.order - b.order)
            .map((sec) => {
              switch (sec.type) {
                case 'hero':
                  return (
                    <HeroSection
                      key={sec.id}
                      product={product}
                      settings={settings}
                      onBuyNowClick={scrollToOrderForm}
                    />
                  );
                case 'categories':
                  return null;
                case 'product_grid':
                  return null;
                case 'benefits':
                  return (
                    <ProductBenefits
                      key={sec.id}
                      benefits={product?.benefits || []}
                      eyebrow={product?.benefitsSection?.eyebrow}
                      heading={product?.benefitsSection?.heading}
                      description={product?.benefitsSection?.description}
                    />
                  );
                case 'featured_product':
                  return (
                    <ProductDescription
                      key={sec.id}
                      product={product}
                      onBuyNowClick={scrollToOrderForm}
                    />
                  );
                case 'features':
                  return (
                    <ProductFeatures
                      key={sec.id}
                      features={product?.features || []}
                    />
                  );
                case 'how_it_works':
                  return <HowItWorks key={sec.id} steps={product?.howItWorks || []} />;
                case 'specifications':
                  return (
                    <ProductSpecifications
                      key={sec.id}
                      specifications={product?.specifications || []}
                    />
                  );
                case 'reviews':
                  return (
                    <CustomerReviews
                      key={sec.id}
                      reviews={reviews}
                      averageRating={product?.rating || 4.9}
                      totalReviews={product?.reviewCount || reviews.length}
                      onNewReviewSubmit={handleNewReview}
                      texts={settings?.reviewsSectionTexts}
                    />
                  );
                case 'trust':
                  return (
                    <TrustSection
                      key={sec.id}
                      trustPoints={settings?.trustPoints || []}
                      texts={settings?.trustSectionTexts}
                    />
                  );
                case 'delivery':
                  return <DeliveryInfo key={sec.id} settings={settings} />;
                case 'order_form':
                  return (
                    <OrderForm
                      key={sec.id}
                      product={product}
                      settings={settings}
                      onOrderSuccess={(order) => setConfirmedOrder(order)}
                    />
                  );
                case 'faqs':
                  return (
                    <FAQSection
                      key={sec.id}
                      faqs={faqs}
                      whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
                      texts={settings?.faqSectionTexts}
                    />
                  );
                default:
                  return null;
              }
            })
        ) : (
          <>
            {/* Fallback layout */}
            <HeroSection
              product={product}
              settings={settings}
              onBuyNowClick={scrollToOrderForm}
            />
            <ProductBenefits
              benefits={product?.benefits || []}
              eyebrow={product?.benefitsSection?.eyebrow}
              heading={product?.benefitsSection?.heading}
              description={product?.benefitsSection?.description}
            />
            <ProductDescription
              product={product}
              onBuyNowClick={scrollToOrderForm}
            />
            <ProductFeatures features={product?.features || []} />
            <HowItWorks steps={product?.howItWorks || []} />
            <ProductSpecifications specifications={product?.specifications || []} />
            <CustomerReviews
              reviews={reviews}
              averageRating={product?.rating || 4.9}
              totalReviews={product?.reviewCount || reviews.length}
              onNewReviewSubmit={handleNewReview}
              texts={settings?.reviewsSectionTexts}
            />
            <TrustSection
              trustPoints={settings?.trustPoints || []}
              texts={settings?.trustSectionTexts}
            />
            <DeliveryInfo settings={settings} />
            <OrderForm
              product={product}
              settings={settings}
              onOrderSuccess={(order) => setConfirmedOrder(order)}
            />
            <FAQSection
              faqs={faqs}
              whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
              texts={settings?.faqSectionTexts}
            />
          </>
        )}
      </main>

      {/* 14. Professional Footer */}
      <Footer
        settings={settings}
        isAdminLoggedIn={!!adminUser}
        onOpenAdmin={handleOpenAdmin}
        onBuyNowClick={scrollToOrderForm}
      />

      {/* 15. Mobile Sticky Bottom CTA Bar */}
      <MobileStickyBar
        salePrice={product.salePrice}
        regularPrice={product.regularPrice}
        whatsappNumber={settings.whatsappNumber}
        whatsappPrefilledMessage={settings.whatsappPrefilledMessage}
        productTitle={product.title}
        onBuyNowClick={scrollToOrderForm}
        visible={stickyVisible}
        onDismiss={() => setStickyVisible(false)}
      />

      {/* 16. Order Confirmation Modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          settings={settings}
          onClose={() => setConfirmedOrder(null)}
        />
      )}

      {/* 17. Quick Admin Panel Floating Launcher (Visible ONLY to Logged-in Admin) */}
      {adminUser && (
        <div className="fixed bottom-22 sm:bottom-6 left-4 z-40 flex items-center gap-2 bg-neutral-900/95 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-neutral-700/80 backdrop-blur-md text-xs font-bold animate-in fade-in">
          <button
            id="floating-admin-launcher"
            onClick={handleOpenAdmin}
            title="Open Store Admin Panel"
            className="flex items-center gap-2 text-[#F5B800] hover:text-white transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Settings className="w-4 h-4 text-[#F5B800]" />
            <span>Admin Dashboard</span>
          </button>
          <span className="text-neutral-600">|</span>
          <button
            onClick={handleAdminLogout}
            className="text-neutral-400 hover:text-red-400 text-[11px] transition cursor-pointer"
            title="Sign out of Admin session"
          >
            Logout
          </button>
        </div>
      )}

    </div>
  );
}
