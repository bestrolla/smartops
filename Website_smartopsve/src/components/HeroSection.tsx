'use client'

import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface HeroSectionProps {
  theme?: Theme;
}

export function HeroSection({ theme }: HeroSectionProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])

  return (
    <section 
      id="inicio" 
      className="relative min-h-screen pt-16 overflow-hidden bg-gradient-to-r from-[#DDDFFF] to-[#EDF0FF]"
      ref={ref}
    >
      {/* Fondo con efecto parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: yBg }}
      >
        <Image
          src="/images/fondo1.png"
          alt="Fondo de aventura"
          fill
          className="object-cover opacity-50 brightness-95 contrast-110"
          quality={100}
          priority
        />
      </motion.div>

      {/* Capa de overlay para mejorar legibilidad */}
      <div className="absolute inset-0 z-1"></div>

      {/* Contenido principal */}
      <div className="container mx-auto min-h-screen lg:h-screen flex items-center relative z-10 px-4 sm:px-6 lg:px-8 pt-2 lg:pt-0 pb-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
          {/* Right Content - Hero Image (Mobile: Bottom, Desktop: Right) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative order-2 lg:order-2"
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Desktop mockup */}
              <motion.div
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                className="relative z-20 w-full max-w-xs md:max-w-lg mx-auto -ml-4 md:-ml-16"
              >
                <img
                  src="/images/laptop2.png"
                  alt="SmartOps Dashboard"
                  className="w-full h-auto rounded-xl"
                />
              </motion.div>

              {/* Phone mockup */}
              <motion.div
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{
                  duration: 7,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                className="absolute bottom-0 right-0 w-1/2 md:w-1/2 h-auto z-30 transform translate-x-1/4 translate-y-1/4"
              >
                <img
                  src="/images/phone-perfil.png"
                  alt="SmartOps Mobile"
                  className="w-full h-auto rounded-lg"
                />
              </motion.div>

              {/* Tarjeta2 encima de la laptop */}
              <motion.div
                animate={{
                  y: [0, -40, 0],
                  rotate: [0, 4, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                className="absolute -top-12 md:-top-20 -right-12 md:-right-20 w-48 md:w-80 h-auto z-30 transform translate-y-3/4 md:translate-y-full"
              >
                <img
                  src="/images/tarjeta2.png"
                  alt="Tarjeta NFC SmartOps"
                  className="w-full h-auto rounded-lg"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Left Content (Mobile: Top, Desktop: Left) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 p-6 md:p-8 lg:px-10 lg:py-4 rounded-xl order-1 lg:order-1 pt-26 lg:pt-0"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-smartops-dark leading-tight">
              Vende más, Trabaja menos. 
              <span className="block mt-2 md:mt-3 text-[#36a9e1]">Automatiza tu negocio hoy con SmartOps.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-lg">
              Presencia digital + Automatización + Tienda Online + Tarjeta NFC, todo en uno.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-smartops-blue hover:bg-smartops-blue-hover text-white text-xl px-12 py-6 rounded-xl font-bold shadow-lg transition-all"
                >
                  Empieza Ahora
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-smartops-blue text-smartops-blue hover:bg-smartops-blue hover:text-white px-8 py-6 text-lg font-bold rounded-xl shadow-sm transition-all"
                >
                  Ver Planes
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}