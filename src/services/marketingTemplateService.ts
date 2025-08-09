/**
 * 🎯 SISTEMA DE PLANTILLAS DE MARKETING - SEGÚN FLUJO.TXT
 * Catálogo de plantillas organizadas por industria/objetivo
 */

export interface MarketingTemplate {
  id: string;
  name: string;
  industry: string;
  objective: string;
  duration: number; // segundos
  tone: 'professional' | 'casual' | 'energetic' | 'emotional' | 'urgent';
  visualStyle: string;
  script: {
    apertura: string;
    problema: string;
    solucion: string;
    propuestaValor: string;
    pruebaSocial: string;
    oferta: string;
    cta: string;
  };
  assets: {
    backgroundMusic?: string;
    colorScheme: string[];
    typography: string;
  };
  active: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 📋 CATÁLOGO DE PLANTILLAS POR INDUSTRIA
 */
export const MARKETING_TEMPLATES: Record<string, MarketingTemplate[]> = {
  
  'ecommerce': [
    {
      id: 'ecommerce-producto-nuevo',
      name: 'Lanzamiento de Producto',
      industry: 'ecommerce',
      objective: 'product_launch',
      duration: 30,
      tone: 'energetic',
      visualStyle: 'moderno',
      script: {
        apertura: '¡Presentamos lo último en {{categoria}}!',
        problema: '¿Cansado de {{problema_comun}}?',
        solucion: 'Nuestro {{producto}} cambia todo',
        propuestaValor: 'Con {{beneficio_principal}}, nunca más {{dolor_anterior}}',
        pruebaSocial: 'Ya {{numero}} clientes han transformado su {{situacion}}',
        oferta: '¡Oferta especial: {{descuento}}% OFF por tiempo limitado!',
        cta: 'Compra ahora y únete a la revolución'
      },
      assets: {
        backgroundMusic: 'upbeat-commercial',
        colorScheme: ['#FF6B35', '#F7931E', '#FFD23F'],
        typography: 'bold-modern'
      },
      active: true,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    {
      id: 'ecommerce-black-friday',
      name: 'Black Friday/Ofertas',
      industry: 'ecommerce',
      objective: 'sales_promotion',
      duration: 20,
      tone: 'urgent',
      visualStyle: 'dinamico',
      script: {
        apertura: '🔥 BLACK FRIDAY EXTREMO',
        problema: 'Los precios regulares te están matando el presupuesto',
        solucion: 'HASTA 70% OFF en toda la tienda',
        propuestaValor: 'Ahorra cientos en tus productos favoritos',
        pruebaSocial: 'Miles de clientes ya están comprando',
        oferta: '¡Solo quedan {{horas}} horas!',
        cta: '¡COMPRA YA antes que se agote!'
      },
      assets: {
        backgroundMusic: 'intense-countdown',
        colorScheme: ['#000000', '#FF0000', '#FFFF00'],
        typography: 'bold-urgent'
      },
      active: true,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  'saas': [
    {
      id: 'saas-onboarding',
      name: 'Onboarding SaaS',
      industry: 'saas',
      objective: 'user_acquisition',
      duration: 45,
      tone: 'professional',
      visualStyle: 'corporativo',
      script: {
        apertura: 'Automatiza tu {{proceso}} en minutos, no meses',
        problema: '¿Perdiendo horas en {{tarea_repetitiva}}?',
        solucion: 'Nuestra plataforma lo hace por ti automáticamente',
        propuestaValor: 'Ahorra {{tiempo}} horas por semana y enfócate en lo importante',
        pruebaSocial: 'Más de {{numero}} empresas ya transformaron su productividad',
        oferta: 'Prueba gratuita de 14 días, sin tarjeta de crédito',
        cta: 'Comienza tu prueba gratuita hoy'
      },
      assets: {
        backgroundMusic: 'corporate-ambient',
        colorScheme: ['#0066CC', '#4A90E2', '#F5F7FA'],
        typography: 'clean-professional'
      },
      active: true,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  'servicios': [
    {
      id: 'servicios-consultoria',
      name: 'Consultoría Profesional',
      industry: 'servicios',
      objective: 'lead_generation',
      duration: 35,
      tone: 'professional',
      visualStyle: 'elegante',
      script: {
        apertura: '¿Tu {{area_negocio}} no da los resultados que esperas?',
        problema: 'Sin la estrategia correcta, sigues perdiendo oportunidades',
        solucion: 'Con {{años}} años de experiencia, podemos ayudarte',
        propuestaValor: 'Incrementa tus {{metrica}} en {{porcentaje}}% en {{tiempo}}',
        pruebaSocial: 'Ya ayudamos a {{numero}} empresas a crecer',
        oferta: 'Consulta inicial GRATIS para analizar tu situación',
        cta: 'Agenda tu consulta gratuita ahora'
      },
      assets: {
        backgroundMusic: 'elegant-corporate',
        colorScheme: ['#2C3E50', '#34495E', '#ECF0F1'],
        typography: 'elegant-serif'
      },
      active: true,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  'educacion': [
    {
      id: 'educacion-curso-online',
      name: 'Curso Online',
      industry: 'educacion',
      objective: 'course_promotion',
      duration: 40,
      tone: 'casual',
      visualStyle: 'amigable',
      script: {
        apertura: '¿Quieres dominar {{habilidad}} de una vez por todas?',
        problema: 'Has probado tutoriales gratis pero sigues sin resultados reales',
        solucion: 'Mi curso paso a paso te lleva de cero a experto',
        propuestaValor: 'En solo {{tiempo}}, tendrás las habilidades que necesitas',
        pruebaSocial: '{{numero}} estudiantes ya transformaron su carrera',
        oferta: 'Acceso de por vida + certificado + garantía 30 días',
        cta: 'Inscríbete ahora y transforma tu futuro'
      },
      assets: {
        backgroundMusic: 'inspiring-educational',
        colorScheme: ['#3498DB', '#2ECC71', '#F39C12'],
        typography: 'friendly-rounded'
      },
      active: true,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

/**
 * 🎯 SERVICIO DE PLANTILLAS
 */
export class MarketingTemplateService {
  
  /**
   * 📋 Obtener catálogo filtrado por industria/objetivo
   */
  static getTemplatesByIndustry(industry: string): MarketingTemplate[] {
    return MARKETING_TEMPLATES[industry] || [];
  }

  /**
   * 🔍 Buscar plantilla por ID
   */
  static getTemplateById(templateId: string): MarketingTemplate | null {
    for (const industryTemplates of Object.values(MARKETING_TEMPLATES)) {
      const template = industryTemplates.find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  }

  /**
   * 📊 Obtener todas las industrias disponibles
   */
  static getAvailableIndustries(): string[] {
    return Object.keys(MARKETING_TEMPLATES);
  }

  /**
   * 🎯 Filtrar plantillas por objetivo
   */
  static getTemplatesByObjective(objective: string): MarketingTemplate[] {
    const allTemplates: MarketingTemplate[] = [];
    for (const industryTemplates of Object.values(MARKETING_TEMPLATES)) {
      allTemplates.push(...industryTemplates.filter(t => t.objective === objective));
    }
    return allTemplates;
  }

  /**
   * ⚙️ Personalizar plantilla con datos del usuario
   */
  static personalizeTemplate(
    template: MarketingTemplate, 
    userProfile: any, 
    customParams: Record<string, string>
  ): MarketingTemplate {
    const personalizedTemplate = { ...template };
    
    // Personalizar script con variables del usuario
    const replacements = {
      ...customParams,
      categoria: userProfile.industry || 'tu categoría',
      producto: userProfile.productName || 'tu producto',
      numero: Math.floor(Math.random() * 1000) + 100,
      beneficio_principal: userProfile.mainBenefit || 'beneficios increíbles',
      // ... más variables dinámicas
    };

    // Reemplazar variables en el script
    Object.keys(personalizedTemplate.script).forEach(key => {
      let scriptText = personalizedTemplate.script[key as keyof typeof personalizedTemplate.script];
      Object.entries(replacements).forEach(([variable, value]) => {
        scriptText = scriptText.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
      (personalizedTemplate.script as any)[key] = scriptText;
    });

    return personalizedTemplate;
  }
}
