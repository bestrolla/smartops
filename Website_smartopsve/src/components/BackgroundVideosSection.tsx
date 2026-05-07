"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface BackgroundVideosSectionProps {
  theme?: Theme;
}

const videos = [
  { src: '/videos/video1.mp4', alt: 'Video 1' }
]

export function BackgroundVideosSection({ theme }: BackgroundVideosSectionProps) {
  return (
    <section className="relative w-full h-[40vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Video de fondo */}
      <div className="absolute inset-0 w-full h-full">
        <video
          src={videos[0].src}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-[32vh] md:h-[60vh] scale-60 md:scale-60"
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/80 pointer-events-none" />
      </div>
      {/* Contenido encima del video */}
      <div className="relative z-10 text-white text-center px-4">
        <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">Descubre SmartOps en acción</h2>
        <p className="text-base md:text-2xl lg:text-3xl drop-shadow-lg mb-6">Automatiza y moderniza tu negocio con videos demostrativos</p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <Button
            asChild
            size="sm"
            className="text-white text-base md:text-xl lg:text-2xl px-8 md:px-12 lg:px-16 py-4 md:py-6 lg:py-8 rounded-lg md:rounded-xl font-bold shadow-lg transition-all"
            style={{ 
              backgroundColor: 'rgb(57, 86, 255)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00D9C3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(57, 86, 255)';
            }}
          >
            <a href="https://www.youtube.com/channel/UCXXXXXXXX" target="_blank" rel="noopener noreferrer">
              Visita nuestro canal de YouTube
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}