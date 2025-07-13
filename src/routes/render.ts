import express from 'express';
import { startJob, getJobStatus, getJobResult } from '../jobs/jobQueue.js';
import { z } from 'zod';

export const renderRouter = express.Router();

// Esquema de validación
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  mode: z.enum(['cinematic', 'videogame', 'anime', 'cartoon', 'story', 'commercial']),
  visualStyle: z.enum(['realistic', 'anime', 'cartoon']),
  duration: z.number().min(1).max(300, 'Duration must be between 1 and 300 seconds'),
});

// 1. Enviar trabajo
renderRouter.post('/', async (req, res) => {
  try {
    const validatedBody = renderRequestSchema.parse(req.body);

    const jobId = await startJob(validatedBody);

    res.status(202).json({
      status: 'processing',
      jobId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Ver estado
renderRouter.get('/status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const status = getJobStatus(jobId);
  res.json({ status });
});

// 3. Obtener resultado
renderRouter.get('/result/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const result = getJobResult(jobId);
  if (!result) {
    return res.status(404).json({ error: 'Result not ready yet' });
  }
  res.json(result);
});
