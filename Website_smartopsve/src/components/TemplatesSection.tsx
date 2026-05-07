'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Eye, Palette, Smartphone, Calendar, ShoppingCart, MessageCircle, Zap, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface TemplatesSectionProps {
  theme?: Theme;
}

interface Profile {
  id: string;
  name: string;
  profession: string;
  description: string;
  image: string;
  colors: string;
  borderColor: string;
  textColor: string;
  style: string;
  bgColor: string;
}

export function TemplatesSection({ theme }: TemplatesSectionProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    async function fetchProfiles() {
      try {
        const response = await fetch('/api/profiles');
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    }

    fetchProfiles();
  }, [isClient]);

  return (
    <section id="perfiles" className="py-20 relative overflow-hidden bg-gradient-to-r from-[#DDDFFF] via-[#EDF0FF] to-[#DDDFFF]">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-eleva-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          
          <h2 className="text-3xl lg:text-4xl font-bold text-eleva-dark mb-4">
            Perfiles Profesionales
          </h2>
          <p className="text-eleva-gray text-lg max-w-2xl mx-auto mb-4">
            Elige el diseño que mejor represente tu profesión. Cada template incluye modo oscuro, temas personalizables y calendario para citas.
          </p>
          <div className="flex items-center justify-center gap-2 text-eleva-blue">
            <span className="text-sm font-medium">Powered by</span>
            <div className="text-lg font-bold">SmartOps</div>
          </div>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Main profiles showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={profile.image}
                        alt={`${profile.name} Background`}
                        fill
                        className="object-cover blur-sm opacity-30"
                      />
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${profile.colors}`}></div>
                    
                    {/* Profile Content */}
                    <div className="relative z-10 p-6 h-full flex flex-col justify-between text-center">
                      {/* Top section */}
                      <div>
                        <div className={`w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 ${profile.borderColor} shadow-lg`}>
                          <Image
                            src={profile.image}
                            alt={profile.name}
                            width={80}
                            height={80}
                            className="object-cover"
                          />
                        </div>
                        <h3 className={`text-lg font-bold ${profile.textColor} mb-1`}>{profile.name}</h3>
                        <p className={`${profile.textColor}/90 text-sm font-medium mb-2`}>{profile.profession}</p>
                        <p className={`${profile.textColor}/80 text-xs`}>{profile.description}</p>
                      </div>

                      {/* Bottom section */}
                      <div>
                        <div className={`${profile.id === 'santiago-oliveira' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-sm rounded-lg px-3 py-2 mb-4`}>
                          <p className={`${profile.textColor} text-sm font-medium`}>{profile.style}</p>
                        </div>
                        
                        {/* Features icons */}
                        <div className="flex justify-center space-x-3 mb-4">
                          <div className={`w-8 h-8 ${profile.id === 'santiago-oliveira' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
                            <svg className={`w-4 h-4 ${profile.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className={`w-8 h-8 ${profile.id === 'santiago-oliveira' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
                            <svg className={`w-4 h-4 ${profile.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className={`w-8 h-8 ${profile.id === 'santiago-oliveira' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
                            <svg className={`w-4 h-4 ${profile.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className={`absolute inset-0 bg-gradient-to-br ${profile.bgColor} flex items-center justify-center`}
                  >
                    <div className="text-white text-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        whileHover={{ scale: 1 }}
                        className="mb-4"
                      >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </motion.div>
                      <div className="text-xl font-bold mb-2 text-white">Ver Template</div>
                      <div className="text-sm opacity-90 text-white">Ejemplo en vivo</div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-eleva-blue/20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-eleva-dark mb-4">
                ¿Listo para crear tu perfil profesional?
              </h3>
              <p className="text-eleva-gray mb-6">
                Cada template es completamente personalizable y está optimizado para móviles
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-eleva-blue hover:bg-eleva-blue/90 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                Comenzar Ahora
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
