const mongoose = require('mongoose');
const ProfileTheme = require('../src/core/profiles/models/profileTheme.model');
require('dotenv').config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';

// Datos de los 4 temas basados en profile-smartops
const profileThemes = [
  {
    // Carlos Carrasco - Diseñador Web (Estilo minimalista y elegante)
    id: 'carlos-carrasco',
    name: 'Carlos Carrasco',
    description: 'Diseñador Web - Estilo minimalista y elegante',
    profession: 'Diseñador Web',
    style: 'Minimalista y Elegante',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    preview_url: '/carlos-carrasco',
    colors: {
      primary: '#111111',    // Negro principal
      secondary: '#1a1a1a',  // Negro secundario
      accent: '#ffffff'      // Blanco acento
    },
    layout: {
      header: 'dark',
      stats: 'minimal',
      services: 'minimal',
      testimonials: 'minimal'
    },
    default_sections: {
      show_stats: true,
      show_testimonials: true,
      show_contact: true,
      show_social: true,
      show_services: false,
      show_products: false,
      show_appointments: false
    },
    sample_data: {
      name: 'Carlos Carrasco',
      title: 'Diseñador Web',
      bio: 'Especialista en crear experiencias digitales únicas y funcionales que conectan marcas con sus audiencias.',
      stats: [
        { label: 'Proyectos', value: '150+' },
        { label: 'Clientes', value: '50+' },
        { label: 'Años', value: '8+' },
        { label: 'Awards', value: '12' }
      ],
      contact: {
        email: 'carlos@example.com',
        phone: '+1 234 567 8900',
        website: 'https://carloscarrasco.com'
      },
      social_links: [
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/carloscarrasco',
          display_name: 'LinkedIn'
        },
        {
          platform: 'github',
          url: 'https://github.com/carloscarrasco',
          display_name: 'GitHub'
        },
        {
          platform: 'instagram',
          url: 'https://instagram.com/carloscarrasco',
          display_name: 'Instagram'
        }
      ]
    },
    category: 'designer',
    tags: ['diseño', 'web', 'minimalista', 'elegante', 'frontend', 'ux/ui']
  },
  
  {
    // Santiago Oliveira - Consultor Digital (Estilo corporativo y limpio)
    id: 'santiago-oliveira',
    name: 'Santiago Oliveira',
    description: 'Consultor Digital - Estilo corporativo y limpio',
    profession: 'Consultor Digital',
    style: 'Corporativo y Limpio',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
    preview_url: '/santiago-oliveira',
    colors: {
      primary: '#ffffff',    // Blanco principal
      secondary: '#f8fafc',  // Gris muy claro
      accent: '#0f172a'      // Azul muy oscuro
    },
    layout: {
      header: 'light',
      stats: 'corporate',
      services: 'corporate',
      testimonials: 'corporate'
    },
    default_sections: {
      show_stats: true,
      show_testimonials: true,
      show_contact: true,
      show_social: true,
      show_services: true,
      show_products: false,
      show_appointments: false
    },
    sample_data: {
      name: 'Santiago Oliveira',
      title: 'Consultor Digital',
      bio: 'Ayudo a empresas a transformar su presencia digital mediante estrategias innovadoras y tecnología de vanguardia.',
      stats: [
        { label: 'Empresas', value: '80+' },
        { label: 'Proyectos', value: '200+' },
        { label: 'Años', value: '12+' },
        { label: 'ROI', value: '340%' }
      ],
      contact: {
        email: 'santiago@example.com',
        phone: '+1 234 567 8901',
        website: 'https://santiagooliveira.com'
      },
      social_links: [
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/santiagooliveira',
          display_name: 'LinkedIn'
        },
        {
          platform: 'twitter',
          url: 'https://twitter.com/santiagooliveira',
          display_name: 'Twitter'
        },
        {
          platform: 'website',
          url: 'https://santiagooliveira.com',
          display_name: 'Website'
        }
      ]
    },
    category: 'consultant',
    tags: ['consultoría', 'digital', 'corporativo', 'estrategia', 'tecnología', 'negocios']
  },
  
  {
    // Dra. Elena Ruiz - Médico Especialista (Estilo profesional médico)
    id: 'elena-ruiz',
    name: 'Dra. Elena Ruiz',
    description: 'Médico Especialista - Estilo profesional médico',
    profession: 'Médico Especialista',
    style: 'Profesional Médico',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    preview_url: '/elena-ruiz',
    colors: {
      primary: '#0ea5e9',    // Azul cielo (blue-600)
      secondary: '#0284c7',  // Azul médico (blue-700)
      accent: '#38bdf8'      // Azul claro (blue-400)
    },
    layout: {
      header: 'gradient-blue',
      stats: 'medical',
      services: 'medical',
      testimonials: 'medical'
    },
    default_sections: {
      show_stats: true,
      show_testimonials: true,
      show_contact: true,
      show_social: false,
      show_services: true,
      show_products: false,
      show_appointments: true
    },
    sample_data: {
      name: 'Dra. Elena Ruiz',
      title: 'Médico Especialista',
      specialty: 'Medicina Interna',
      bio: 'Comprometida con brindar atención médica integral y personalizada. Más de 15 años de experiencia en diagnóstico y tratamiento.',
      stats: [
        { label: 'Pacientes', value: '2,500+' },
        { label: 'Experiencia', value: '15 años' },
        { label: 'Certificaciones', value: '8' },
        { label: 'Satisfacción', value: '98%' }
      ],
      contact: {
        email: 'elena.ruiz@hospital.com',
        phone: '+1 234 567 8902',
        website: 'https://draelenaruiz.com'
      },
      social_links: [
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/draelenaruiz',
          display_name: 'LinkedIn Profesional'
        }
      ]
    },
    category: 'medical',
    tags: ['médico', 'salud', 'profesional', 'atención', 'especialista', 'medicina']
  },
  
  {
    // Marco Torres - Artista Visual (Estilo creativo y dinámico)
    id: 'marco-torres',
    name: 'Marco Torres',
    description: 'Artista Visual - Estilo creativo y dinámico',
    profession: 'Artista Visual',
    style: 'Creativo y Dinámico',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    preview_url: '/marco-torres',
    colors: {
      primary: '#a855f7',    // Púrpura (purple-500)
      secondary: '#ec4899',  // Rosa (pink-500)
      accent: '#f97316'      // Naranja (orange-500)
    },
    layout: {
      header: 'gradient-art',
      stats: 'creative',
      services: 'creative',
      testimonials: 'creative'
    },
    default_sections: {
      show_stats: true,
      show_testimonials: true,
      show_contact: true,
      show_social: true,
      show_services: true,
      show_products: true,
      show_appointments: false
    },
    sample_data: {
      name: 'Marco Torres',
      title: 'Artista Visual',
      specialty: 'Arte Digital & Ilustración',
      bio: 'Creador de mundos visuales únicos que conectan emociones y tecnología. Mi arte trasciende límites y explora nuevas dimensiones creativas.',
      stats: [
        { label: 'Obras', value: '300+' },
        { label: 'Exposiciones', value: '25' },
        { label: 'Premios', value: '12' },
        { label: 'Clientes', value: '150+' }
      ],
      contact: {
        email: 'marco@artemarco.com',
        phone: '+1 234 567 8903',
        website: 'https://artemarco.com'
      },
      social_links: [
        {
          platform: 'instagram',
          url: 'https://instagram.com/artemarco',
          display_name: 'Instagram'
        },
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/marcotorres',
          display_name: 'LinkedIn'
        },
        {
          platform: 'website',
          url: 'https://artemarco.com',
          display_name: 'Portfolio'
        }
      ]
    },
    category: 'creative',
    tags: ['arte', 'visual', 'creativo', 'digital', 'ilustración', 'diseño']
  }
];

async function addProfileThemes() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n📋 Agregando temas de perfiles...');
    
    for (const themeData of profileThemes) {
      try {
        // Verificar si el tema ya existe
        const existingTheme = await ProfileTheme.findOne({ id: themeData.id });
        
        if (existingTheme) {
          console.log(`⚠️  Tema "${themeData.name}" ya existe, actualizando...`);
          await ProfileTheme.findOneAndUpdate(
            { id: themeData.id },
            themeData,
            { new: true, upsert: true }
          );
        } else {
          console.log(`➕ Creando tema: ${themeData.name}`);
          const theme = new ProfileTheme(themeData);
          await theme.save();
        }
        
        console.log(`✅ Tema "${themeData.name}" procesado correctamente`);
      } catch (error) {
        console.error(`❌ Error procesando tema "${themeData.name}":`, error.message);
      }
    }

    console.log('\n📊 Verificando temas creados...');
    const totalThemes = await ProfileTheme.countDocuments();
    console.log(`📈 Total de temas en la base de datos: ${totalThemes}`);

    const activeThemes = await ProfileTheme.find({ isActive: true, isPublic: true });
    console.log(`📈 Temas activos y públicos: ${activeThemes.length}`);

    console.log('\n📋 Lista de temas:');
    activeThemes.forEach((theme, index) => {
      console.log(`${index + 1}. ${theme.name} (${theme.category}) - ${theme.style}`);
    });

    console.log('\n🎉 ¡Script completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
if (require.main === module) {
  addProfileThemes();
}

module.exports = { addProfileThemes, profileThemes };
