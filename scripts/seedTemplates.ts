import { PrismaClient } from '../generated/prisma/index.js';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

const sampleTemplates = [
  {
    title: "Promoción Flash Restaurante",
    description: "Plantilla para promociones de tiempo limitado en restaurantes",
    businessType: "restaurant",
    category: "promotional",
    structure: {
      steps: [
        { type: "hook", content: "Atención amantes de la comida!", duration: 2 },
        { type: "offer", content: "50% de descuento en todos los platillos principales", duration: 4 },
        { type: "urgency", content: "Válido solo hasta el domingo", duration: 3 },
        { type: "cta", content: "Reserva ya y ahorra", duration: 1 }
      ]
    },
    duration: 30,
    style: "energetic",
    tone: "urgent",
    musicStyle: "upbeat",
    voiceType: "female",
    effectsEnabled: true,
    tags: JSON.stringify(["promocion", "descuento", "urgencia", "comida"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Presentación de Servicios Spa",
    description: "Plantilla profesional para mostrar servicios de spa y wellness",
    businessType: "spa",
    category: "service",
    structure: {
      steps: [
        { type: "intro", content: "Descubre la tranquilidad que mereces", duration: 3 },
        { type: "services", content: "Masajes, faciales y tratamientos relajantes", duration: 5 },
        { type: "benefits", content: "Libera el estrés y renueva tu energía", duration: 3 },
        { type: "cta", content: "Agenda tu cita hoy", duration: 2 }
      ]
    },
    duration: 30,
    style: "luxury",
    tone: "inspirational",
    musicStyle: "emotional",
    voiceType: "neutral",
    effectsEnabled: true,
    tags: JSON.stringify(["spa", "relajacion", "bienestar", "servicios"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Lanzamiento de Producto Tech",
    description: "Plantilla moderna para presentar nuevos productos tecnológicos",
    businessType: "tech",
    category: "product",
    structure: {
      steps: [
        { type: "problem", content: "¿Cansado de aplicaciones lentas?", duration: 3 },
        { type: "solution", content: "Presentamos la nueva solución revolucionaria", duration: 4 },
        { type: "features", content: "Rápida, segura y fácil de usar", duration: 4 },
        { type: "cta", content: "Descarga gratis ahora", duration: 2 }
      ]
    },
    duration: 30,
    style: "professional",
    tone: "authoritative",
    musicStyle: "corporate",
    voiceType: "male",
    effectsEnabled: true,
    tags: JSON.stringify(["tecnologia", "producto", "innovacion", "app"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Testimonio Cliente Fitness",
    description: "Plantilla para mostrar testimonios de clientes de gimnasios",
    businessType: "fitness",
    category: "testimonial",
    structure: {
      steps: [
        { type: "intro", content: "Lo que dicen nuestros miembros", duration: 2 },
        { type: "testimonial", content: "Perdí 15 kilos en 3 meses gracias al entrenamiento personalizado", duration: 6 },
        { type: "results", content: "Más de 1000 transformaciones exitosas", duration: 3 },
        { type: "cta", content: "Únete a nuestra familia fitness", duration: 2 }
      ]
    },
    duration: 30,
    style: "energetic",
    tone: "inspirational",
    musicStyle: "energetic",
    voiceType: "female",
    effectsEnabled: true,
    tags: JSON.stringify(["fitness", "testimonio", "transformacion", "resultados"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Promoción Navideña Retail",
    description: "Plantilla especial para promociones de temporada navideña",
    businessType: "retail",
    category: "seasonal",
    structure: {
      steps: [
        { type: "season", content: "Esta Navidad encuentra el regalo perfecto", duration: 3 },
        { type: "offer", content: "Hasta 40% de descuento en toda la tienda", duration: 4 },
        { type: "variety", content: "Miles de productos para toda la familia", duration: 4 },
        { type: "cta", content: "Visítanos antes de que se agoten", duration: 2 }
      ]
    },
    duration: 30,
    style: "professional",
    tone: "friendly",
    musicStyle: "upbeat",
    voiceType: "neutral",
    effectsEnabled: true,
    tags: JSON.stringify(["navidad", "promocion", "retail", "descuento", "regalos"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Curso Online Educativo",
    description: "Plantilla para promocionar cursos y programas educativos",
    businessType: "education",
    category: "educational",
    structure: {
      steps: [
        { type: "problem", content: "¿Quieres dominar nuevas habilidades?", duration: 3 },
        { type: "solution", content: "Nuestro curso online te llevará al siguiente nivel", duration: 4 },
        { type: "benefits", content: "Aprende a tu ritmo con instructores expertos", duration: 4 },
        { type: "cta", content: "Inscríbete con 50% de descuento", duration: 2 }
      ]
    },
    duration: 30,
    style: "professional",
    tone: "authoritative",
    musicStyle: "corporate",
    voiceType: "male",
    effectsEnabled: true,
    tags: JSON.stringify(["educacion", "curso", "aprendizaje", "online"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Evento Empresarial",
    description: "Plantilla para invitaciones a eventos y conferencias",
    businessType: "services",
    category: "event",
    structure: {
      steps: [
        { type: "announcement", content: "Te invitamos a nuestro evento exclusivo", duration: 3 },
        { type: "details", content: "Conferencia de liderazgo empresarial - 15 de marzo", duration: 4 },
        { type: "speakers", content: "Con los mejores expertos de la industria", duration: 4 },
        { type: "cta", content: "Reserva tu lugar gratuito ahora", duration: 2 }
      ]
    },
    duration: 30,
    style: "professional",
    tone: "professional",
    musicStyle: "corporate",
    voiceType: "neutral",
    effectsEnabled: false,
    tags: JSON.stringify(["evento", "conferencia", "networking", "empresarial"]),
    thumbnail: null,
    sampleVideo: null
  },
  {
    title: "Presentación de Marca Beauty",
    description: "Plantilla elegante para presentar marcas de cosmética y belleza",
    businessType: "beauty",
    category: "brand",
    structure: {
      steps: [
        { type: "intro", content: "Descubre tu belleza natural", duration: 3 },
        { type: "brand", content: "Somos más que cosmética, somos tu aliado de belleza", duration: 5 },
        { type: "values", content: "Productos naturales, cruelty-free y sostenibles", duration: 4 },
        { type: "cta", content: "Conoce nuestra colección completa", duration: 3 }
      ]
    },
    duration: 45,
    style: "luxury",
    tone: "inspirational",
    musicStyle: "emotional",
    voiceType: "female",
    effectsEnabled: true,
    tags: JSON.stringify(["belleza", "cosmética", "natural", "marca", "lujo"]),
    thumbnail: null,
    sampleVideo: null
  }
];

async function seedTemplates() {
  try {
    logger.info('🌱 Iniciando seed de plantillas de marketing...');

    // Limpiar plantillas existentes
    await prisma.marketingTemplate.deleteMany({});
    logger.info('🧹 Plantillas existentes eliminadas');

    // Insertar nuevas plantillas
    for (const template of sampleTemplates) {
      await prisma.marketingTemplate.create({
        data: template
      });
      logger.info(`✅ Plantilla creada: ${template.title}`);
    }

    logger.info(`🎉 Seed completado! ${sampleTemplates.length} plantillas creadas`);

    // Mostrar estadísticas
    const stats = await prisma.marketingTemplate.groupBy({
      by: ['businessType'],
      _count: {
        _all: true
      }
    });

    logger.info('📊 Plantillas por tipo de negocio:');
    stats.forEach(stat => {
      logger.info(`   ${stat.businessType}: ${stat._count._all} plantillas`);
    });

  } catch (error) {
    logger.error('❌ Error en seed de plantillas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => {
      logger.info('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedTemplates };
