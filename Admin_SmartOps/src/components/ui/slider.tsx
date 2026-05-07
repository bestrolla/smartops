import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

export function Slider({ 
  children, 
  className, 
  showArrows = true, 
  autoPlay = false, 
  interval = 3000 
}: SliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenArray = React.Children.toArray(children);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % childrenArray.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + childrenArray.length) % childrenArray.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || childrenArray.length <= 1) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [currentIndex, autoPlay, isHovered, interval, childrenArray.length]);

  if (childrenArray.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container */}
      <div 
        ref={containerRef}
        className="overflow-hidden rounded-lg relative w-full"
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${childrenArray.length * 100}%`
          }}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ 
                width: `${100 / childrenArray.length}%`,
                minWidth: `${100 / childrenArray.length}%`
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && childrenArray.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {childrenArray.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex 
                  ? "bg-blue-600 scale-125" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
