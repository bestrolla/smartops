'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface FooterProps {
  theme?: Theme;
}

export function Footer({ theme }: FooterProps) {
  // Función para obtener estilos basados en el tema
  const getFooterStyle = (theme?: Theme) => {
    if (!theme) {
      return {
        background: 'bg-[#1d1f21]',
        textColor: 'text-white',
        subtitleColor: 'text-gray-300',
        linkColor: 'text-gray-300 hover:text-white',
        borderColor: 'border-gray-700',
        inputBg: 'bg-gray-700',
        buttonBg: 'rgb(57, 86, 255)',
        buttonHover: '#00D9C3',
        socialBg: 'rgb(55, 65, 81)',
        socialHover: '#00D9C3',
        accentColor: '#3956FF'
      };
    }

    switch (theme.name) {
      case 'minimal':
        return {
          background: 'bg-gray-900',
          textColor: 'text-white',
          subtitleColor: 'text-gray-400',
          linkColor: 'text-gray-400 hover:text-white',
          borderColor: 'border-gray-800',
          inputBg: 'bg-gray-800',
          buttonBg: theme.accent_color,
          buttonHover: theme.primary_color,
          socialBg: 'rgb(75, 85, 99)',
          socialHover: theme.accent_color,
          accentColor: theme.accent_color
        };
      case 'artistic':
        return {
          background: 'bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900',
          textColor: 'text-white',
          subtitleColor: 'text-purple-200',
          linkColor: 'text-purple-200 hover:text-white',
          borderColor: 'border-purple-700',
          inputBg: 'bg-purple-800/50',
          buttonBg: theme.accent_color,
          buttonHover: theme.primary_color,
          socialBg: 'rgba(147, 51, 234, 0.5)',
          socialHover: theme.accent_color,
          accentColor: theme.accent_color
        };
      case 'professional':
        return {
          background: 'bg-slate-900',
          textColor: 'text-white',
          subtitleColor: 'text-slate-300',
          linkColor: 'text-slate-300 hover:text-white',
          borderColor: 'border-slate-700',
          inputBg: 'bg-slate-800',
          buttonBg: theme.accent_color,
          buttonHover: theme.primary_color,
          socialBg: 'rgb(51, 65, 85)',
          socialHover: theme.accent_color,
          accentColor: theme.accent_color
        };
      default: // cards
        return {
          background: 'bg-gray-800',
          textColor: 'text-white',
          subtitleColor: 'text-gray-300',
          linkColor: 'text-gray-300 hover:text-white',
          borderColor: 'border-gray-600',
          inputBg: 'bg-gray-700',
          buttonBg: theme.accent_color,
          buttonHover: theme.primary_color,
          socialBg: 'rgb(55, 65, 81)',
          socialHover: theme.accent_color,
          accentColor: theme.accent_color
        };
    }
  };

  const styles = getFooterStyle(theme);

  return (
    <footer id="contacto" className={`${styles.background} ${styles.textColor} relative overflow-hidden`}>
      {/* Background decoration - Puedes reemplazar esta imagen con una propia */}
      <div className="absolute top-0 right-0">
        <img
          src="/images/logo-dark.png" // Cambia por tu propia imagen decorativa
          alt="Footer decoration"
          className="w-64 h-auto opacity-10"
        />
      </div>

      {/* Elementos artísticos para tema artistic */}
      {theme?.name === 'artistic' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Link href="#inicio">
                <img 
                  src="/images/logo-dark.png" // Asegúrate de tener esta versión
                  alt="SmartOps Logo"
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            <p className={`${styles.subtitleColor} leading-relaxed mb-6 max-w-md`}>
              {theme?.name === 'minimal' ? 
                'Gestión empresarial optimizada.' :
                'Plataforma de gestión empresarial con analytics avanzados y herramientas de productividad para optimizar tus operaciones.'
              }
            </p>

            {/* Social media icons */}
            <div className="flex space-x-4">
              <Link 
                href="#" 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80`}
                style={{ 
                  backgroundColor: 'var(--social-bg-color)',
                  '--social-bg-color': styles.socialBg 
                } as React.CSSProperties}
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80`}
                style={{ 
                  backgroundColor: 'var(--social-bg-color)',
                  '--social-bg-color': styles.socialBg 
                } as React.CSSProperties}
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80`}
                style={{ 
                  backgroundColor: 'var(--social-bg-color)',
                  '--social-bg-color': styles.socialBg 
                } as React.CSSProperties}
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80`}
                style={{ 
                  backgroundColor: 'var(--social-bg-color)',
                  '--social-bg-color': styles.socialBg 
                } as React.CSSProperties}
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">
              {theme?.name === 'minimal' ? 'Links' : 'Enlaces rápidos'}
            </h4>
            <ul className="space-y-2">
              <li><Link href="#inicio" className={`${styles.linkColor} transition-colors`}>Inicio</Link></li>
              <li><Link href="#caracteristicas" className={`${styles.linkColor} transition-colors`}>Características</Link></li>
              <li><Link href="#soluciones" className={`${styles.linkColor} transition-colors`}>Soluciones</Link></li>
              <li><Link href="#precios" className={`${styles.linkColor} transition-colors`}>Precios</Link></li>
              <li><Link href="#contacto" className={`${styles.linkColor} transition-colors`}>Contacto</Link></li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className={`space-y-2 ${styles.subtitleColor}`}>
              <p>info@smartops.com</p>
              <p>+1 (555) 123-4567</p>
              <p>123 Business St.<br />Ciudad, País 12345</p>
            </div>
          </motion.div>

          {/* Newsletter (opcional) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className={`${styles.subtitleColor} mb-4`}>
              {theme?.name === 'minimal' ? 'Suscríbete.' : 'Suscríbete para recibir actualizaciones.'}
            </p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Tu email" 
                className={`px-4 py-2 rounded-l-md ${styles.inputBg} text-white focus:outline-none focus:ring-2 w-full focus:ring-blue-500`}
              />
              <button 
                type="submit" 
                className={`px-4 py-2 rounded-r-md text-white font-medium transition-colors hover:opacity-90 bg-blue-600 ${
                  theme?.name === 'minimal' ? 'rounded-none' : ''
                }`}
              >
                {theme?.name === 'minimal' ? 'OK' : 'Enviar'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className={`border-t ${styles.borderColor} mt-12 pt-8 flex flex-col md:flex-row justify-between items-center`}
        >
          <p className={`${styles.subtitleColor} text-sm mb-4 md:mb-0`} suppressHydrationWarning>
            © {new Date().getFullYear()} SmartOps. Todos los derechos reservados.
          </p>

          <div className="flex space-x-6 text-sm">
            <Link href="/terminos" className={`${styles.linkColor} transition-colors`}>
              {theme?.name === 'minimal' ? 'Términos' : 'Términos y condiciones'}
            </Link>
            <Link href="/privacidad" className={`${styles.linkColor} transition-colors`}>
              {theme?.name === 'minimal' ? 'Privacidad' : 'Políticas de Privacidad'}
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}