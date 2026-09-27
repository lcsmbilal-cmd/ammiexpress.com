import React from 'react';
import { Star, ShieldCheck, Truck, CheckCircle2, MessageCircle, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { ProductGallery } from './ProductGallery';

interface HeroSectionProps {
  product: Product;
  settings: StoreSettings;
  onBuyNowClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  product,
  settings,
  onBuyNowClick
}) => {
  const discountPercent = Math.round(
    ((product.regularPrice - product.salePrice) / product.regularPrice) * 100
  );
  const savingsAmount = product.regularPrice - product.salePrice;

  // WhatsApp link preparation
  const cleanNumber = (settings?.whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const rawMsg = settings?.whatsappPrefilledMessage || 'Assalam-o-Alaikum Ammi Express, I need information about {product}.';
  const encodedMsg = encodeURIComponent(
    rawMsg.replace('{product}', product?.title || 'Ammi Express Smart Chopper')
  );
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=${encodedMsg}`;

  return (
    <section id="hero" className="py-6 md:py-12 bg-gradient-to-b from-[#FFF9E6]/60 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Desktop: 2-column (Left: Info, Right: Gallery) | Mobile: Gallery on top */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Gallery Column (Desktop Right, Mobile First) */}
          <div className="w-full lg:col-span-6 lg:order-2">
            <ProductGallery
              images={product.images}
              productTitle={product.title}
              badge={product.badge}
            />
          </div>

          {/* Info Column (Desktop Left, Mobile Second) */}
          <div className="w-full lg:col-span-6 lg:order-1 flex flex-col space-y-4 md:space-y-5">
            
            {/* Top Micro Badges */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="bg-[#F5B800]/20 text-[#8C6000] font-extrabold px-3 py-1 rounded-full border border-[#F5B800]/40">
                {settings?.heroSettings?.badge || 'Official Ammi Express'}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock ({product.stockCount} left)
              </span>
              {settings?.heroSettings?.saleNotice && (
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                  {settings.heroSettings.saleNotice}
                </span>
              )}
            </div>

            {/* Headline & Title */}
            <div>
              <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-[#F5B800] mb-1">
                {settings?.heroSettings?.subheading || product.headline}
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] tracking-tight leading-snug">
                {settings?.heroSettings?.heading || product.title}
                {settings?.heroSettings?.headingHighlight && (
                  <span className="text-[#F5B800] block mt-1">
                    {settings.heroSettings.headingHighlight}
                  </span>
                )}
              </h1>
            </div>

            {/* Ratings & Social Proof */}
            <div className="flex items-center gap-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-sm text-[#171717]">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-neutral-400 text-sm">•</span>
              <a
                href="#reviews"
                className="text-xs md:text-sm font-semibold text-neutral-600 hover:text-black underline underline-offset-2"
              >
                {product.reviewCount} verified Pakistani reviews
              </a>
            </div>

            {/* Pricing Showcase (Section 8 of prompt) */}
            <div className="bg-[#FFF9E6] border border-[#F5B800]/40 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight">
                  Rs. {product.salePrice.toLocaleString()}
                </span>
                <span className="text-lg sm:text-xl text-neutral-500 line-through font-medium">
                  Rs. {product.regularPrice.toLocaleString()}
                </span>
                <span className="bg-[#C62828] text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wide">
                  {discountPercent}% OFF
                </span>
              </div>
              <div className="mt-2 text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F5B800]" />
                <span>You Save: Rs. {savingsAmount.toLocaleString()} today!</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-sm md:text-base text-neutral-700 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Dynamic Product Benefits / Key Features */}
            {(() => {
              const activeBenefits = (product.benefits || [])
                .filter((b) => b.enabled !== false && ((b.text && b.text.trim()) || (b.title && b.title.trim())))
                .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

              if (activeBenefits.length === 0) return null;

              return (
                <div id="product-hero-benefits" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {activeBenefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className="flex items-center gap-2 text-xs md:text-sm font-semibold text-neutral-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16803D] shrink-0" />
                      <span>{benefit.text || benefit.title}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CTAs Section (Section 9 & 24) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Buy Now CTA */}
              <button
                type="button"
                onClick={onBuyNowClick}
                className="flex-1 bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-base sm:text-lg py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-98"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{settings?.heroSettings?.buttonText || 'BUY NOW (Cash on Delivery)'}</span>
              </button>

              {/* Order on WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#16803D] hover:bg-[#126830] text-white font-extrabold text-sm sm:text-base py-4 px-6 rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle className="w-5 h-5 fill-current shrink-0" />
                <span>Order on WhatsApp</span>
              </a>
            </div>

            {/* Trust Badges below CTA */}
            <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-neutral-600">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#F5B800]" />
                <span>Rs. {settings.deliveryCharge} Flat Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16803D]" />
                <span>Open &amp; Check Parcel</span>
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span>2-4 Business Days</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
