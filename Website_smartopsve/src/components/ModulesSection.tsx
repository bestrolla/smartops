'use client'

import { motion } from 'framer-motion'
import { Link as LinkIcon, Palette, Smartphone, Calendar, ShoppingCart, MessageCircle, Zap, CreditCard } from 'lucide-react'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface ModulesSectionProps {
  theme?: Theme;
}

export function ModulesSection({ theme }: ModulesSectionProps) {
  const modules = [
    {
      icon: LinkIcon,
      title: 'Perfil Digital Profesional',
      features: [
        'Link único con todo tu negocio',
        'Personalizable: colores, logo, plantilla',
        'Acceso directo a contacto, redes, productos y citas'
      ],
      image: '/images/2.png' // Reemplaza con tu imagen
    },
    {
      icon: ShoppingCart,
      title: 'Tienda Online o Agenda de Citas',
      features: [
        'Ecommerce conectado a WhatsApp',
        'Sistema de agendamiento automático',
        'Recordatorios y confirmaciones automáticas'
      ],
      image: '/images/tienda.jpg' // Reemplaza con tu imagen
    },
    {
      icon: MessageCircle,
      title: 'Automatización en Redes Sociales',
      features: [
        'Chatbots para IG, WhatsApp, Facebook',
        'Desde FAQs hasta IA avanzada',
        'Ahorra tiempo y mejora tu atención'
      ],
      image: '/images/redes.jpg' // Reemplaza con tu imagen
    },
    {
      icon: CreditCard,
      title: 'Tarjeta NFC Personalizada',
      features: [
        'Redirige al perfil digital',
        'Ideal para networking',
        'Con tu logo y colores'
      ],
      image: '/images/tarjeta1.png' // Reemplaza con tu imagen
    }
  ]

  return (
    <section id="soluciones" className="py-5 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-ramsha text-smartops-dark mb-4">
            Módulos y Funcionalidades
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas para modernizar y automatizar tu negocio en una sola plataforma
          </p>
        </motion.div>

        <div className="space-y-24">
          {modules.map((module, index) => (
            <motion.div
              key={`module-${module.title.replace(/\s+/g, '-').toLowerCase()}-${index}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Image - Alterna lados en desktop, siempre abajo en móvil */}
              <div className={`order-2 lg:order-1 ${index % 2 === 1 ? 'lg:col-start-2 lg:order-2' : ''}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl overflow-hidden shadow-xl bg-white"
                >
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>

              {/* Content - Siempre primero en móvil */}
              <div className={`space-y-6 order-1 lg:order-2 text-center lg:text-center ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1 lg:order-1' : ''}`}>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-smartops-blue text-white rounded-xl">
                  <module.icon className="w-6 h-6" />
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-smartops-dark">
                  {module.title}
                </h3>

                <ul className="space-y-3 text-left lg:text-center">
                  {module.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start lg:justify-center">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 bg-smartops-blue/10 rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-smartops-blue" />
                        </div>
                      </div>
                      <span className="ml-3 text-gray-600 text-lg md:text-xl lg:text-2xl">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}