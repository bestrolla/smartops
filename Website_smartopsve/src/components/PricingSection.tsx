'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, Zap, Diamond, Crown } from 'lucide-react'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface PricingSectionProps {
  theme?: Theme;
}

export function PricingSection({ theme }: PricingSectionProps) {
  // Función para obtener estilos basados en el tema
  const getPricingStyle = (theme?: Theme) => {
    if (!theme) {
      return {
        background: 'linear-gradient(100deg, #DDDFFF 0%, #EDF0FF 52%)',
        titleColor: 'text-smartops-dark',
        subtitleColor: 'text-gray-600',
        cardBorder: 'border-gray-200',
        popularBorder: 'border-smartops-blue',
        popularBg: 'bg-smartops-blue',
        buttonBg: 'bg-gray-900 hover:bg-gray-800',
        popularButtonBg: 'bg-smartops-blue hover:bg-smartops-blue/90',
        accentColor: '#3956FF'
      };
    }

    switch (theme.name) {
      case 'minimal':
        return {
          background: 'bg-gray-50',
          titleColor: 'text-gray-900',
          subtitleColor: 'text-gray-600',
          cardBorder: 'border-gray-300',
          popularBorder: 'border-gray-900',
          popularBg: 'bg-gray-900',
          buttonBg: 'bg-gray-800 hover:bg-gray-700',
          popularButtonBg: 'bg-gray-900 hover:bg-gray-800',
          accentColor: theme.accent_color
        };
      case 'artistic':
        return {
          background: 'bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100',
          titleColor: 'text-purple-900',
          subtitleColor: 'text-purple-700',
          cardBorder: 'border-purple-200',
          popularBorder: 'border-purple-500',
          popularBg: 'bg-purple-500',
          buttonBg: 'bg-purple-600 hover:bg-purple-700',
          popularButtonBg: 'bg-purple-500 hover:bg-purple-600',
          accentColor: theme.accent_color
        };
      case 'professional':
        return {
          background: 'bg-slate-100',
          titleColor: 'text-slate-900',
          subtitleColor: 'text-slate-600',
          cardBorder: 'border-slate-300',
          popularBorder: 'border-blue-600',
          popularBg: 'bg-blue-600',
          buttonBg: 'bg-slate-700 hover:bg-slate-800',
          popularButtonBg: 'bg-blue-600 hover:bg-blue-700',
          accentColor: theme.accent_color
        };
      default: // cards
        return {
          background: 'bg-white',
          titleColor: 'text-gray-900',
          subtitleColor: 'text-gray-600',
          cardBorder: 'border-gray-200',
          popularBorder: 'border-blue-500',
          popularBg: 'bg-blue-500',
          buttonBg: 'bg-gray-900 hover:bg-gray-800',
          popularButtonBg: 'bg-blue-500 hover:bg-blue-600',
          accentColor: theme.accent_color
        };
    }
  };

  const styles = getPricingStyle(theme);

  const plans = [
    {
      name: '✨ Básico',
      price: '$15/mes',
      popular: false,
      features: [
        'Perfil digital completo',
        '1 red social conectada',
        'Hasta 40 productos/citas',
        '100 pedidos mensuales',
        'Soporte básico por email'
      ],
      cta: 'Quiero este plan',
      icon: Sparkles
    },
    {
      name: '💰 Emprendedor',
      price: '$29/mes',
      popular: true,
      features: [
        'Todo lo del plan Básico',
        '2 redes sociales conectadas',
        'Hasta 100 productos/citas',
        '500 pedidos mensuales',
        'Soporte prioritario'
      ],
      cta: 'Quiero este plan',
      icon: Zap
    },
    {
      name: '💎 Empresarial',
      price: '$59/mes',
      popular: false,
      features: [
        'Automatización total',
        'Productos/citas ilimitados',
        '2000 pedidos mensuales',
        'Acceso multiusuario',
        'Soporte 24/7'
      ],
      cta: 'Quiero este plan',
      icon: Diamond
    },
    {
      name: '🌟 Elite',
      price: '$69/mes + $20 NFC',
      popular: false,
      features: [
        'Todo lo del plan Empresarial',
        'CRM integrado',
        'Sistema de promociones',
        'Gestor de inventario avanzado',
        'Tarjeta NFC incluida'
      ],
      cta: 'Quiero este plan',
      icon: Crown
    }
  ]

  return (
    <section id="precios" className={`py-20 ${styles.background}`} style={theme?.name === 'cards' || !theme ? { background: styles.background } : {}}>
      <div className="container mx-auto px-4">
        {/* Elementos artísticos para tema artistic */}
        {theme?.name === 'artistic' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-20 w-24 h-24 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-20 w-32 h-32 bg-gradient-to-br from-orange-300/30 to-yellow-300/30 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full blur-lg"></div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className={`${theme?.name === 'minimal' ? 'text-4xl lg:text-5xl' : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'} font-ramsha ${styles.titleColor} mb-4`}>
            {theme?.name === 'minimal' ? 'Planes' : 'Elige el plan perfecto para tí'}
          </h2>
          <p className={`text-lg md:text-xl lg:text-2xl ${styles.subtitleColor} max-w-2xl mx-auto`}>
            💥 Pago anual = 2 meses GRATIS
          </p>
          {theme?.name === 'artistic' && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-10">
          {plans.map((plan, index) => (
            <motion.div
              key={`plan-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${plan.popular ? 'md:-translate-y-3' : ''}`}
            >
              {plan.popular && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${styles.popularBg} text-white px-4 py-1 rounded-full text-sm font-medium shadow-md`}>
                  {theme?.name === 'minimal' ? 'Top' : 'Recomendado'}
                </div>
              )}

              <Card className={`h-full flex flex-col ${
                plan.popular ? `border-2 ${styles.popularBorder} shadow-xl` : `shadow-lg ${styles.cardBorder}`
              } ${
                theme?.name === 'artistic' ? 'backdrop-blur-sm bg-white/90' :
                theme?.name === 'professional' ? 'bg-white shadow-lg' :
                theme?.name === 'minimal' ? 'bg-white border-l-4' : 'bg-white'
              }`}
              style={theme?.name === 'minimal' && plan.popular ? { borderLeftColor: styles.accentColor } : {}}
              >
                <CardHeader className="text-center p-6 pb-0">
                  <div className="flex justify-center mb-4">
                    <plan.icon className="w-8 h-8" style={{ color: plan.popular ? styles.accentColor : '#6B7280' }} />
                  </div>
                  <CardTitle className={`text-2xl font-bold ${styles.titleColor}`}>
                    {theme?.name === 'minimal' ? plan.name.replace(/[✨💰💎🌟]/g, '').trim() : plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center mt-4">
                    <span className={`text-3xl font-bold ${styles.titleColor}`}>{plan.price.split('/')[0]}</span>
                    <span className={`${styles.subtitleColor} ml-1`}>/{plan.price.split('/')[1]}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 flex-grow flex flex-col">
                  <div className="space-y-3 mb-6 mt-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={`feature-${featureIndex}`} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 ml-2 text-base md:text-lg lg:text-xl">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full mt-auto ${plan.popular ? styles.popularButtonBg : styles.buttonBg} ${
                      theme?.name === 'minimal' ? 'rounded-none' : ''
                    }`}
                    size="lg"
                  >
                    {theme?.name === 'minimal' ? 'Elegir' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Elementos decorativos para tema minimal */}
        {theme?.name === 'minimal' && (
          <div className="flex justify-center mt-16">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-12 h-0.5 bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}