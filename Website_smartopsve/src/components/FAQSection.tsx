'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface FAQSectionProps {
  theme?: Theme;
}

export default function FAQSection({ theme }: FAQSectionProps) {
  // Función para obtener estilos basados en el tema
  const getFAQStyle = (theme?: Theme) => {
    if (!theme) {
      return {
        background: 'bg-white',
        titleColor: 'text-smartops-dark',
        questionColor: 'text-smartops-dark',
        answerColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        hoverColor: 'hover:text-smartops-blue',
        accentColor: '#3956FF'
      };
    }

    switch (theme.name) {
      case 'minimal':
        return {
          background: 'bg-gray-50',
          titleColor: 'text-gray-900',
          questionColor: 'text-gray-800',
          answerColor: 'text-gray-600',
          borderColor: 'border-gray-300',
          hoverColor: 'hover:text-gray-900',
          accentColor: theme.accent_color
        };
      case 'artistic':
        return {
          background: 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50',
          titleColor: 'text-purple-900',
          questionColor: 'text-purple-800',
          answerColor: 'text-purple-700',
          borderColor: 'border-purple-200',
          hoverColor: 'hover:text-purple-900',
          accentColor: theme.accent_color
        };
      case 'professional':
        return {
          background: 'bg-slate-50',
          titleColor: 'text-slate-900',
          questionColor: 'text-slate-800',
          answerColor: 'text-slate-600',
          borderColor: 'border-slate-300',
          hoverColor: 'hover:text-slate-900',
          accentColor: theme.accent_color
        };
      default: // cards
        return {
          background: 'bg-white',
          titleColor: 'text-gray-900',
          questionColor: 'text-gray-800',
          answerColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:text-blue-600',
          accentColor: theme.accent_color
        };
    }
  };

  const styles = getFAQStyle(theme);

  const faqs = [
    {
      question: '¿Qué es SmartOps y cómo ayuda a mi negocio?',
      answer: 'SmartOps es una plataforma todo-en-uno que combina presencia digital, automatización y herramientas de venta. Te ayuda a vender más (con tienda online o agendamiento de citas), reducir tareas manuales (chatbots, recordatorios automáticos) y proyectar una imagen profesional (perfil digital + tarjeta NFC). Ideal para emprendedores y empresas que quieren escalar sin complicaciones.'
    },
    {
      question: '¿Necesito conocimientos técnicos para usar SmartOps?',
      answer: '¡No! Nuestra plataforma es 100% autogestionable y fácil de usar. Con tutoriales paso a paso y soporte prioritario, tendrás todo listo en menos de 1 hora.'
    },
    {
      question: '¿Qué incluye el "Perfil Digital Profesional"?',
      answer: 'Es tu link único personalizable (ej: smartops.com/tunegocio) donde clientes encuentran: tu catálogo, redes sociales, botón de WhatsApp, agenda de citas y más. Puedes elegir plantillas, colores y hasta dominios propios (opcional).'
    },
    {
      question: '¿Cómo funcionan las tarjetas NFC? ¿Están incluidas en todos los planes?',
      answer: 'Las tarjetas NFC son opcionales (solo en el plan Elite o como add-on en otros planes). Al acercarla a un celular, redirige a tu perfil digital. Perfectas para networking o clientes físicos. Incluye plantillas para que personalices con tu logo y colores.'
    },
    {
      question: '¿Puedo cobrar a través de la tienda online?',
      answer: 'Sí, tu tienda online se integra con WhatsApp para gestionar pedidos, y puedes agregar enlaces de pago (PayPal, Binance, etc.). En planes superiores, ofrecemos pasarelas de pago directas.'
    },
    {
      question: '¿Hay contratos obligatorios o cargos ocultos?',
      answer: 'No hay trampas. Puedes cancelar cuando quieras. El pago es mensual o anual (con 2 meses gratis). Todos los costos se detallan al elegir tu plan.'
    },
    {
      question: '¿Qué pasa si necesito ayuda? ¿Tienen soporte en Venezuela?',
      answer: '¡Sí! Ofrecemos soporte prioritario por WhatsApp y email de lunes a viernes (8am a 6pm). También tenemos una biblioteca de vídeos y guías en la plataforma.'
    },
    {
      question: '¿Puedo cambiar de plan después?',
      answer: 'Claro. Puedes upgrade o downgrade según las necesidades de tu negocio. Los cambios son inmediatos y solo pagas la diferencia.'
    }
  ]

  return (
    <section className={`py-20 ${styles.background}`}>
      <div className="container mx-auto px-4">
        {/* Elementos artísticos para tema artistic */}
        {theme?.name === 'artistic' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-orange-300/20 to-yellow-300/20 rounded-full blur-xl"></div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className={`text-3xl lg:text-4xl font-bold ${styles.titleColor} mb-4`}>
            {theme?.name === 'minimal' ? 'FAQ' : 'Preguntas frecuentes'}
          </h2>
          {theme?.name === 'artistic' && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.accentColor }}></div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={`faq-${faq.question.slice(0, 20).replace(/\s+/g, '-')}-${index}`}
                value={`item-${index}`}
                className={`border ${styles.borderColor} rounded-lg px-6 py-2 hover:shadow-md transition-all duration-200 ${
                  theme?.name === 'artistic' ? 'backdrop-blur-sm bg-white/80' : 
                  theme?.name === 'professional' ? 'bg-white shadow-sm' :
                  theme?.name === 'minimal' ? 'bg-white border-l-4' : 'bg-white'
                }`}
                style={theme?.name === 'minimal' ? { borderLeftColor: styles.accentColor } : {}}
              >
                <AccordionTrigger 
                  className={`text-left ${styles.questionColor} font-montserrat-bold ${styles.hoverColor} transition-colors duration-200 text-base md:text-lg ${
                    theme?.name === 'minimal' ? 'lg:text-lg' : 'lg:text-xl'
                  }`}
                >
                  {theme?.name === 'professional' && (
                    <span className="inline-block w-2 h-2 rounded-full mr-3" style={{ backgroundColor: styles.accentColor }}></span>
                  )}
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className={`${styles.answerColor} leading-relaxed pt-2 font-montserrat-light text-base md:text-lg ${
                  theme?.name === 'minimal' ? 'lg:text-lg' : 'lg:text-xl'
                }`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Elementos decorativos para tema minimal */}
        {theme?.name === 'minimal' && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}