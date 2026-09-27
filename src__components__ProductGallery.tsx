import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, Image as ImageIcon } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  badge?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productTitle,
  badge
}) => {
  const safeImages = images && images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1000&q=85'
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main Image Viewport */}
      <div
        className="relative w-full aspect-square bg-neutral-100 rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm select-none cursor-crosshair group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Active Main Image */}
        <img
          src={safeImages[activeIndex]}
          alt={`${productTitle} - Image ${activeIndex + 1}`}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-200 ease-out ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
        />

        {/* Promo / Bestseller Badge */}
        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-[#171717]/90 backdrop-blur-xs text-[#F5B800] text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md border border-[#F5B800]/30 tracking-wide">
              {badge}
            </span>
          </div>
        )}

        {/* Zoom Hint / Fullscreen trigger */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="View fullscreen image"
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 hover:bg-white text-neutral-800 rounded-xl shadow-md flex items-center justify-center transition hover:scale-105"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Navigation Arrows (Visible on Hover or Touch) */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-md flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100 hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-md flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100 hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image index indicator pill */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
          {activeIndex + 1} / {safeImages.length}
        </div>
      </div>

      {/* Thumbnails row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition ${
                activeIndex === idx
                  ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20 scale-102 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-800 z-50 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-800 transition z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-800 transition z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center select-none">
            <img
              src={safeImages[activeIndex]}
              alt={`${productTitle} - Large`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
            {activeIndex + 1} of {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
};
