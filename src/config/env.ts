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
  MURF_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ARTLIST_TOKEN: z.string().optional(),
  RUNWAY_API_TOKEN: z.string().optional(),
  DM_API_TOKEN: z.string().optional(),
  CDN_BUCKET_URL: z.string(),
  NODE_ENV: z.string().default('development'),
  OPENROUTER_API_KEY: z.string(),
});

const env = schema.parse(process.env);
export { env };
