import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno desde .env si existe, pero no fallar si no está (prod suele inyectar envs)
try {
  dotenv.config();
} catch {
  // Silencioso: en producción normalmente no hay .env, no es un error bloqueante
}

// Solo marcamos como requeridas las esenciales para login/registro y funcionamiento básico
const schema = z.object({
  // Básicas de operación del servidor
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('5000'),
  JWT_SECRET: z.string().min(16).default('fallback_jwt_secret_change_in_production'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3001'),

  // Base de datos principal (Prisma/Postgres) - opcional aquí, Prisma validará en uso
  DATABASE_URL: z.string().optional(),

  // Integraciones opcionales: no bloquear arranque
  FAL_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  MURF_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ARTLIST_TOKEN: z.string().optional(),
  DM_API_TOKEN: z.string().optional(),
  CDN_BUCKET_URL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GCP_PROJECT_ID: z.string().optional(),
  GCP_CREDENTIALS_JSON: z.string().optional(),
  GCP_BUCKET_NAME: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  GEN2_CONCURRENCY: z.string().optional(),
  GEN2_TIMEOUT_MS: z.string().optional(),
  FFMPEG_TIMEOUT_MS: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),
  FREESOUND_API_KEY: z.string().optional(),
  RUNWAYML_API_SECRET: z.string().optional(),
  RUNWAY_API_TOKEN: z.string().optional(),
  
  // PayPal Configuration (solo requeridas por feature de pagos)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_STARTER_PLAN_ID: z.string().optional(),
  PAYPAL_CREATOR_PLAN_ID: z.string().optional(),
  PAYPAL_STUDIO_PRO_PLAN_ID: z.string().optional(),

  // Marketing Agent Configuration
  MARKETING_AGENT_ENABLED: z.string().optional(),
  MARKETING_AGENT_DEBUG: z.string().optional(),
  
  // Instagram API Configuration
  INSTAGRAM_API_VERSION: z.string().optional(),
  INSTAGRAM_BASE_URL: z.string().optional(),
  INSTAGRAM_TIMEOUT: z.string().optional(),
  INSTAGRAM_RETRY_ATTEMPTS: z.string().optional(),
  INSTAGRAM_RATE_LIMIT: z.string().optional(),
  
  // Marketing Jobs Configuration
  MARKETING_JOBS_ENABLED: z.string().optional(),
  TIMEZONE: z.string().optional(),
  INSTAGRAM_SYNC_SCHEDULE: z.string().optional(),
  WEEKLY_REPORTS_SCHEDULE: z.string().optional(),
  CONTENT_MONITOR_SCHEDULE: z.string().optional(),
  
  // Marketing Logging Configuration
  MARKETING_LOGGING_ENABLED: z.string().optional(),
  MARKETING_LOG_LEVEL: z.string().optional(),
  MARKETING_DETAILED_LOGGING: z.string().optional(),
  MARKETING_METRICS_LOGGING: z.string().optional(),
  
  // AI Configuration for Marketing Agent
  AI_PROVIDER: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_MAX_TOKENS: z.string().optional(),
  AI_TEMPERATURE: z.string().optional(),
  AI_TIMEOUT: z.string().optional(),
  
  // Cache Configuration
  MARKETING_CACHE_ENABLED: z.string().optional(),
  MARKETING_CACHE_TTL: z.string().optional(),
  MARKETING_CACHE_PREFIX: z.string().optional(),
});

const env = schema.parse(process.env);

// Advertir si faltan variables opcionales importantes
const opcionales = [
  'ELEVENLABS_API_KEY',
  'ARTLIST_TOKEN',
  'DM_API_TOKEN',
  'GEN2_CONCURRENCY',
  'GEN2_TIMEOUT_MS',
  'FFMPEG_TIMEOUT_MS',
  'OPENROUTER_BASE_URL',
  'OPENROUTER_HTTP_REFERER',
  'OPENROUTER_X_TITLE',
  'FREESOUND_API_KEY',
  'RUNWAYML_API_SECRET',
  'RUNWAY_API_TOKEN',
  'ADMIN_TOKEN',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  // Marketing Agent variables
  'MARKETING_AGENT_ENABLED',
  'INSTAGRAM_API_VERSION',
  'MARKETING_JOBS_ENABLED',
  'AI_PROVIDER',
  'AI_MODEL'
];
for (const key of opcionales) {
  if (!process.env[key]) {
    console.warn(`[AVISO] Variable opcional no definida: ${key}`);
  }
}

export { env };
