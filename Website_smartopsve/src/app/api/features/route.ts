import { NextResponse } from 'next/server';
import { User, ShoppingCart, Share2, CreditCard, Settings } from 'lucide-react';

export async function GET() {
  try {
    // Datos estáticos de características para la sección de features
    const features = [
      {
        id: 1,
        title: "Perfil Digital Profesional",
        description: "Crea tu presencia online con un perfil personalizable que incluye todos tus servicios, contacto y redes sociales.",
        icon: "User"
      },
      {
        id: 2,
        title: "Tienda Online Integrada",
        description: "Vende tus productos o servicios directamente desde tu perfil con sistema de pagos integrado.",
        icon: "ShoppingCart"
      },
      {
        id: 3,
        title: "Compartir Fácil",
        description: "Comparte tu perfil profesional con un solo link personalizado en todas tus redes sociales.",
        icon: "Share2"
      },
      {
        id: 4,
        title: "Pagos Seguros",
        description: "Acepta pagos de forma segura con múltiples métodos de pago integrados.",
        icon: "CreditCard"
      },
      {
        id: 5,
        title: "Panel de Control",
        description: "Gestiona todo desde un panel intuitivo: productos, citas, clientes y estadísticas.",
        icon: "Settings"
      }
    ];

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error en /api/features:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}