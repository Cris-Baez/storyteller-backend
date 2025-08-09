import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw new Error('No se pudo cargar el archivo .env');
}

const schema = z.object({
  FAL_KEY: z.string(), // ✅ AGREGADO: FAL_KEY para acceder a Kling via fal.ai
  OPENAI_API_KEY: z.string(),
  REPLICATE_API_TOKEN: z.string(),
  MURF_API_KEY: z.string(), // Cambiar de opcional a requerido
  ELEVENLABS_API_KEY: z.string().optional(),
  ARTLIST_TOKEN: z.string().optional(),
  // RUNWAY_API_TOKEN: z.string().optional(), // Eliminado: ya no se usa RunwayML
  DM_API_TOKEN: z.string().optional(),
  CDN_BUCKET_URL: z.string(),
  NODE_ENV: z.string().default('development'),
  OPENROUTER_API_KEY: z.string(),
  GCP_PROJECT_ID: z.string(),
  GCP_CREDENTIALS_JSON: z.string(),
  GCP_BUCKET_NAME: z.string(),
  JWT_SECRET: z.string().optional().default('fallback_jwt_secret_change_in_production'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3001'),
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
  
  // PayPal Configuration
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_STARTER_PLAN_ID: z.string().optional(),
  PAYPAL_CREATOR_PLAN_ID: z.string().optional(),
  PAYPAL_STUDIO_PRO_PLAN_ID: z.string().optional(),
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
];
for (const key of opcionales) {
  if (!process.env[key]) {
    console.warn(`[AVISO] Variable opcional no definida: ${key}`);
  }
}

export { env };
