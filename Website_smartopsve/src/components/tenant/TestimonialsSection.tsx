'use client';
import { Testimonial } from '@/types';
import { Quote, Star } from 'lucide-react';
import { useState } from 'react';

interface Theme {
  id?: string;
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  layout?: {
    header?: string;
    stats?: string;
    services?: string;
    testimonials?: string;
  };
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  theme?: Theme | null;
}


export function TestimonialsSection({ testimonials }: { testimonials: any[] }) {
  const [page, setPage] = useState<number>(1);
  const hasTestimonials = Array.isArray(testimonials) && testimonials.length > 0;

  if (!hasTestimonials) {
    return null;
  }

  const [index, setIndex] = useState(0);
  const total = testimonials.length;
  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(total - 1, i + 1));

  return (
    <div className="px-6 py-4 bg-gray-50 relative">
      <div className="flex items-center gap-2 mb-3">
        <Quote className="w-4 h-4 text-gray-700" />
        <h3 className="font-bold text-gray-900 font-montserrat text-sm">Testimonios</h3>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex" style={{ transform: `translateX(-${index * 100}%)`, transition: 'transform 300ms ease' }}>
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="min-w-full p-4 border border-gray-200 bg-white flex flex-col rounded-lg shadow-sm">
              <div className="text-center mb-2">
                <span className="font-semibold text-sm text-gray-800 font-montserrat">{testimonial.name || 'Anónimo'}</span>
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex items-center gap-2 w-full justify-center">
                  <Quote className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed text-center max-w-[600px]">
                    {(() => {
                      const content = Array.isArray(testimonial.content) ? testimonial.content.join(' ') : testimonial.content;
                      return content && content.length > 200 ? `${content.substring(0, 200)}...` : content || 'Sin contenido';
                    })()}
                  </p>
                </div>
              </div>
              <div className="text-center mt-3">
                <div className="text-yellow-500">
                  {Array.from({ length: testimonial.rating || 5 }, (_, i) => (
                    <Star key={i} className="w-4 h-4 inline-block fill-current text-yellow-500" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={prev} className="absolute -left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow w-7 h-7 rounded-full flex items-center justify-center" aria-label="Anterior">
          <span className="sr-only">Anterior</span>
          <span className="text-gray-700">‹</span>
        </button>
        <button type="button" onClick={next} className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow w-7 h-7 rounded-full flex items-center justify-center" aria-label="Siguiente">
          <span className="sr-only">Siguiente</span>
          <span className="text-gray-700">›</span>
        </button>
      </div>
    </div>
  );
}