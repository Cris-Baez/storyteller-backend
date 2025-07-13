import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw new Error('No se pudo cargar el archivo .env');
}

const schema = z.object({
  OPENAI_API_KEY: z.string(),
  REPLICATE_API_TOKEN: z.string(),
  MURF_API_KEY: z.string(), // Cambiar de opcional a requerido
  ELEVENLABS_API_KEY: z.string().optional(),
  ARTLIST_TOKEN: z.string().optional(),
  RUNWAY_API_TOKEN: z.string().optional(),
  DM_API_TOKEN: z.string().optional(),
  CDN_BUCKET_URL: z.string(),
  NODE_ENV: z.string().default('development'),
  OPENROUTER_API_KEY: z.string(),
  GCP_PROJECT_ID: z.string(),
  GCP_CREDENTIALS_JSON: z.string(),
  GCP_BUCKET_NAME: z.string(),
  GEN2_CONCURRENCY: z.string().optional(),
  GEN2_TIMEOUT_MS: z.string().optional(),
  FFMPEG_TIMEOUT_MS: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),
  FREESOUND_API_KEY: z.string().optional()
});

const env = schema.parse(process.env);
export { env };
