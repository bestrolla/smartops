'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Menu, ChevronDown, Globe } from 'lucide-react'
import Image from 'next/image';
import { animate } from 'framer-motion'

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface HeaderProps {
  theme?: Theme;
}

function scrollToSection(id: string) {
  const yOffset = -80; // Ajusta según el alto del header
  const el = document.getElementById(id.replace('#', ''));
  if (el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    animate(window.scrollY, y, {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => window.scrollTo(0, latest)
    });
  }
}

export function Header({ theme }: HeaderProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)

  const navigationItems = [
    { href: '#inicio', label: 'Inicio' },
    { href: '#caracteristicas', label: 'Características' },
    { href: '#soluciones', label: 'Soluciones' },
    { href: '#perfiles', label: 'Perfiles' },
    { href: '#precios', label: 'Precios' },
    { href: '#contacto', label: 'Contacto' },
  ]

  const languages = [
    'English', 'Español'
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-smartops-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="container mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <a href="#inicio" className="flex items-center" aria-label="SmartOps - Ir al inicio">
            <Image
              src="/images/logo.png"
              alt="SmartOps Logo"
              width={120} // Ajusta según las proporciones de tu logo
              height={40}
              className="h-6 w-auto dark:hidden"
              priority // Importante para el logo que aparece arriba
            />
            <Image
              src="/images/logo-dark.png"
              alt="SmartOps Logo"
              width={120}
              height={40}
              className="h-6 w-auto hidden dark:block"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollToSection(item.href)}
              className="text-smartops-dark hover:text-smartops-blue-hover transition-colors duration-200 font-montserrat-bold bg-transparent border-none outline-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center space-x-1 text-smartops-dark hover:text-smartops-blue-hover transition-colors duration-200 font-montserrat-bold"
            >
              <Globe className="w-4 h-4" />
              <span>Idioma</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {isLanguageOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-smartops-dark text-sm font-montserrat-light"
                    onClick={() => setIsLanguageOpen(false)}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Login Button */}
        <div className="hidden lg:flex">
          <Button
            variant="default"
            className="bg-smartops-blue hover:bg-smartops-blue-hover text-white font-montserrat-bold"
          >
            Iniciar sesión
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col space-y-6 pt-6">
              {navigationItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <button
                    onClick={() => {
                      scrollToSection(item.href);
                    }}
                    className="text-lg font-montserrat-bold text-smartops-dark hover:text-smartops-blue-hover transition-colors bg-transparent border-none outline-none cursor-pointer"
                  >
                    {item.label}
                  </button>
                </SheetClose>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <Button className="w-full bg-smartops-blue hover:bg-smartops-blue-hover text-white font-montserrat-bold">
                  Iniciar sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
