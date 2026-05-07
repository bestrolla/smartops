import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Datos estáticos de perfiles de ejemplo para la sección de templates
    const profiles = [
      {
        id: 1,
        name: "Dr. María González",
        profession: "Médico Especialista",
        image: "/images/profiles/doctor.jpg",
        slug: "maria-gonzalez",
        category: "Salud",
        description: "Especialista en medicina interna con más de 15 años de experiencia.",
        featured: true
      },
      {
        id: 2,
        name: "Carlos Rodríguez",
        profession: "Abogado",
        image: "/images/profiles/lawyer.jpg",
        slug: "carlos-rodriguez",
        category: "Legal",
        description: "Abogado especializado en derecho corporativo y civil.",
        featured: true
      },
      {
        id: 3,
        name: "Ana Martínez",
        profession: "Arquitecta",
        image: "/images/profiles/architect.jpg",
        slug: "ana-martinez",
        category: "Arquitectura",
        description: "Arquitecta con enfoque en diseño sostenible y moderno.",
        featured: true
      },
      {
        id: 4,
        name: "Luis Pérez",
        profession: "Chef Ejecutivo",
        image: "/images/profiles/chef.jpg",
        slug: "luis-perez",
        category: "Gastronomía",
        description: "Chef especializado en cocina internacional y eventos.",
        featured: true
      },
      {
        id: 5,
        name: "Elena Ruiz",
        profession: "Psicóloga",
        image: "/images/profiles/psychologist.jpg",
        slug: "elena-ruiz",
        category: "Salud Mental",
        description: "Psicóloga clínica especializada en terapia familiar.",
        featured: false
      },
      {
        id: 6,
        name: "Roberto Silva",
        profession: "Contador",
        image: "/images/profiles/accountant.jpg",
        slug: "roberto-silva",
        category: "Finanzas",
        description: "Contador público con experiencia en asesoría fiscal.",
        featured: false
      }
    ];

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error en /api/profiles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}