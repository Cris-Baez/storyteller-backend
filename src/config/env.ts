import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),
  FREESOUND_API_KEY: z.string().optional(),
  FFMPEG_TIMEOUT_MS: z.string().optional(),
  GEN2_CONCURRENCY: z.string().optional(),
  GEN2_TIMEOUT_MS: z.string().optional(),
  GCP_PROJECT_ID: z.string(),
  GCP_CREDENTIALS_JSON: z.string(),
  GCP_BUCKET_NAME: z.string()
});

export const env = schema.parse(process.env);
