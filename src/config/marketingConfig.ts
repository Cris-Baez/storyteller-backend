import { env } from './env.js';

/**
 * 🔧 CONFIGURACIÓN DEL MARKETING AGENT
 * Configuraciones centralizadas para el Marketing Agent
 */

export interface MarketingAgentConfig {
  // Configuración general
  enabled: boolean;
  debug: boolean;
  environment: string;
  
  // Configuración de Instagram API
  instagram: {
    apiVersion: string;
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimitPerHour: number;
  };
  
  // Configuración de trabajos automáticos
  jobs: {
    enabled: boolean;
    timezone: string;
    schedules: {
      instagramSync: string;
      weeklyReports: string;
      contentMonitor: string;
    };
  };
  
  // Configuración de límites por plan
  planLimits: {
    STARTER: {
      socialAccounts: number;
      requestsPerHour: number;
      reportsPerDay: number;
      features: string[];
    };
    CREATOR: {
      socialAccounts: number;
      requestsPerHour: number;
      reportsPerDay: number;
      features: string[];
    };
    STUDIO_PRO: {
      socialAccounts: number;
      requestsPerHour: number;
      reportsPerDay: number;
      features: string[];
    };
  };
  
  // Configuración de logging
  logging: {
    enabled: boolean;
    level: string;
    detailedLogging: boolean;
    metricsLogging: boolean;
  };
  
  // Configuración de análisis de IA
  ai: {
    provider: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
  
  // Configuración de cache
  cache: {
    enabled: boolean;
    ttl: number;
    prefix: string;
  };
}

/**
 * Configuración por defecto del Marketing Agent
 */
const defaultConfig: MarketingAgentConfig = {
  // Configuración general
  enabled: true,
  debug: false,
  environment: 'production',
  
  // Instagram API
  instagram: {
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.instagram.com',
    timeout: 30000, // 30 segundos
    retryAttempts: 3,
    rateLimitPerHour: 200
  },
  
  // Trabajos automáticos
  jobs: {
    enabled: true,
    timezone: 'America/New_York',
    schedules: {
      instagramSync: '0 */6 * * *',     // Cada 6 horas
      weeklyReports: '0 9 * * 1',       // Lunes a las 9 AM
      contentMonitor: '0 */2 * * *'     // Cada 2 horas
    }
  },
  
  // Límites por plan
  planLimits: {
    STARTER: {
      socialAccounts: 0,
      requestsPerHour: 10,
      reportsPerDay: 0,
      features: []
    },
    CREATOR: {
      socialAccounts: 2,
      requestsPerHour: 50,
      reportsPerDay: 5,
      features: [
        'dailyBrief',
        'weeklyReports',
        'instagramAnalytics',
        'contentOptimization'
      ]
    },
    STUDIO_PRO: {
      socialAccounts: 10,
      requestsPerHour: 200,
      reportsPerDay: 20,
      features: [
        'dailyBrief',
        'weeklyReports',
        'instagramAnalytics',
        'contentOptimization',
        'competitorAnalysis',
        'advancedInsights'
      ]
    }
  },
  
  // Logging
  logging: {
    enabled: true,
    level: 'info',
    detailedLogging: false,
    metricsLogging: true
  },
  
  // IA
  ai: {
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 60000 // 60 segundos
  },
  
  // Cache
  cache: {
    enabled: true,
    ttl: 3600, // 1 hora
    prefix: 'marketing_agent:'
  }
};

/**
 * Cargar configuración desde variables de entorno
 */
function loadConfigFromEnv(): Partial<MarketingAgentConfig> {
  return {
    // Configuración general
    enabled: env.MARKETING_AGENT_ENABLED === 'true',
    debug: env.MARKETING_AGENT_DEBUG === 'true',
    environment: env.NODE_ENV || 'production',
    
    // Instagram
    instagram: {
      apiVersion: env.INSTAGRAM_API_VERSION || defaultConfig.instagram.apiVersion,
      baseUrl: env.INSTAGRAM_BASE_URL || defaultConfig.instagram.baseUrl,
      timeout: parseInt(env.INSTAGRAM_TIMEOUT || '30000'),
      retryAttempts: parseInt(env.INSTAGRAM_RETRY_ATTEMPTS || '3'),
      rateLimitPerHour: parseInt(env.INSTAGRAM_RATE_LIMIT || '200')
    },
    
    // Trabajos
    jobs: {
      enabled: env.MARKETING_JOBS_ENABLED === 'true',
      timezone: env.TIMEZONE || defaultConfig.jobs.timezone,
      schedules: {
        instagramSync: env.INSTAGRAM_SYNC_SCHEDULE || defaultConfig.jobs.schedules.instagramSync,
        weeklyReports: env.WEEKLY_REPORTS_SCHEDULE || defaultConfig.jobs.schedules.weeklyReports,
        contentMonitor: env.CONTENT_MONITOR_SCHEDULE || defaultConfig.jobs.schedules.contentMonitor
      }
    },
    
    // Logging
    logging: {
      enabled: env.MARKETING_LOGGING_ENABLED !== 'false',
      level: env.MARKETING_LOG_LEVEL || defaultConfig.logging.level,
      detailedLogging: env.MARKETING_DETAILED_LOGGING === 'true',
      metricsLogging: env.MARKETING_METRICS_LOGGING !== 'false'
    },
    
    // IA
    ai: {
      provider: env.AI_PROVIDER || defaultConfig.ai.provider,
      model: env.AI_MODEL || defaultConfig.ai.model,
      maxTokens: parseInt(env.AI_MAX_TOKENS || '2000'),
      temperature: parseFloat(env.AI_TEMPERATURE || '0.7'),
      timeout: parseInt(env.AI_TIMEOUT || '60000')
    },
    
    // Cache
    cache: {
      enabled: env.MARKETING_CACHE_ENABLED !== 'false',
      ttl: parseInt(env.MARKETING_CACHE_TTL || '3600'),
      prefix: env.MARKETING_CACHE_PREFIX || defaultConfig.cache.prefix
    }
  };
}

/**
 * Fusionar configuración por defecto con variables de entorno
 */
function mergeConfig(defaultConfig: MarketingAgentConfig, envConfig: Partial<MarketingAgentConfig>): MarketingAgentConfig {
  return {
    ...defaultConfig,
    ...envConfig,
    instagram: {
      ...defaultConfig.instagram,
      ...envConfig.instagram
    },
    jobs: {
      ...defaultConfig.jobs,
      ...envConfig.jobs,
      schedules: {
        ...defaultConfig.jobs.schedules,
        ...envConfig.jobs?.schedules
      }
    },
    planLimits: {
      ...defaultConfig.planLimits,
      ...envConfig.planLimits
    },
    logging: {
      ...defaultConfig.logging,
      ...envConfig.logging
    },
    ai: {
      ...defaultConfig.ai,
      ...envConfig.ai
    },
    cache: {
      ...defaultConfig.cache,
      ...envConfig.cache
    }
  };
}

/**
 * Validar configuración
 */
function validateConfig(config: MarketingAgentConfig): void {
  // Validar configuración de Instagram
  if (!config.instagram.apiVersion) {
    throw new Error('Instagram API version es requerida');
  }
  
  if (!config.instagram.baseUrl) {
    throw new Error('Instagram base URL es requerida');
  }
  
  // Validar configuración de IA
  if (!config.ai.provider) {
    throw new Error('AI provider es requerido');
  }
  
  if (!config.ai.model) {
    throw new Error('AI model es requerido');
  }
  
  // Validar límites de planes
  Object.entries(config.planLimits).forEach(([plan, limits]) => {
    if (limits.socialAccounts < 0) {
      throw new Error(`Límite de cuentas sociales para ${plan} no puede ser negativo`);
    }
    
    if (limits.requestsPerHour <= 0) {
      throw new Error(`Límite de requests para ${plan} debe ser mayor a 0`);
    }
  });
}

/**
 * Configuración final del Marketing Agent
 */
const envConfig = loadConfigFromEnv();
export const marketingConfig: MarketingAgentConfig = mergeConfig(defaultConfig, envConfig);

// Validar configuración al cargar
try {
  validateConfig(marketingConfig);
} catch (error) {
  console.error('[MarketingConfig] Error de configuración:', error);
  process.exit(1);
}

/**
 * Utilidades de configuración
 */
export const configUtils = {
  /**
   * Obtener límites para un plan específico
   */
  getPlanLimits: (plan: keyof typeof marketingConfig.planLimits) => {
    return marketingConfig.planLimits[plan];
  },
  
  /**
   * Verificar si una funcionalidad está habilitada para un plan
   */
  isPlanFeatureEnabled: (plan: keyof typeof marketingConfig.planLimits, feature: string) => {
    return marketingConfig.planLimits[plan].features.includes(feature);
  },
  
  /**
   * Obtener configuración de Instagram
   */
  getInstagramConfig: () => {
    return marketingConfig.instagram;
  },
  
  /**
   * Obtener configuración de trabajos
   */
  getJobsConfig: () => {
    return marketingConfig.jobs;
  },
  
  /**
   * Verificar si el Marketing Agent está habilitado
   */
  isEnabled: () => {
    return marketingConfig.enabled;
  },
  
  /**
   * Verificar si está en modo debug
   */
  isDebugMode: () => {
    return marketingConfig.debug;
  }
};

// Log de configuración al inicializar (solo en debug)
if (marketingConfig.debug) {
  console.log('[MarketingConfig] Configuración cargada:', {
    enabled: marketingConfig.enabled,
    environment: marketingConfig.environment,
    jobsEnabled: marketingConfig.jobs.enabled,
    loggingLevel: marketingConfig.logging.level,
    aiProvider: marketingConfig.ai.provider
  });
}
