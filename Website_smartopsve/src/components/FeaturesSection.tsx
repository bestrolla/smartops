'use client'

import { motion } from 'framer-motion'
import { User, ShoppingCart, Share2, CreditCard, Settings } from 'lucide-react'
import { useEffect, useState } from 'react';

interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

interface FeaturesProps {
  theme?: Theme;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeaturesSection({ theme }: FeaturesProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/features');
        const data = await response.json();
        setFeatures(data);
      } catch (error) {
        console.error('Error fetching features:', error);
      }
    }

    fetchFeatures();
  }, [isClient]);

  return (
    <section id="caracteristicas" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-smartops-dark mb-4">
            La Solución Digital Integral que tu Negocio Necesita
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed">
            SmartOps Venezuela es más que una plataforma. Es tu aliado para vender sin interrupciones, automatizar tareas repetitivas y dar a tu negocio una presencia moderna 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}