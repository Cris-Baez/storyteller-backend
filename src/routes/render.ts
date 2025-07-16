import express from 'express';
import { startJob, getJobStatus, getJobResult } from '../jobs/jobQueue.js';
import { z } from 'zod';

export const renderRouter = express.Router();

// Esquema de validación
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').transform(val => 
    val.replace(/[^\x00-\x7F]/g, "").trim() || "Create a cinematic story"
  ),
  // Modos soportados por el backend y SYSTEM prompt
  mode: z.enum(['cinematic', 'videogame', 'anime', 'cartoon', 'story', 'commercial', 'comercial', 'realistic']),
  // Estilos visuales soportados por llmService.ts
  visualStyle: z.enum(['realistic', 'anime', 'cartoon', 'cinematic', 'comercial', 'commercial']),
  duration: z.number().min(1).max(300, 'Duration must be between 1 and 300 seconds'),
});

// 1. Enviar trabajo
renderRouter.post('/', async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    console.log('Prompt recibido (raw):', JSON.stringify(req.body.prompt));
    console.log('Prompt recibido (bytes):', Buffer.from(req.body.prompt || '', 'utf8'));
    
    // Sanitizar el prompt
    if (req.body.prompt) {
      req.body.prompt = req.body.prompt
        .replace(/[^\x00-\x7F]/g, "") // Eliminar caracteres no ASCII
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim();
      
      // Si después de la sanitización queda muy corto, usar un prompt por defecto
      if (req.body.prompt.length < 10) {
        req.body.prompt = "Create a cinematic story about a character's journey through an epic adventure";
      }
    }
    
    console.log('Prompt sanitizado:', req.body.prompt);
    
    const validatedBody = renderRequestSchema.parse(req.body);

    const jobId = await startJob(validatedBody);

    // Respuesta rápida
    res.status(202).json({
      status: 'processing',
      jobId,
    });

    // Log detallado
    console.log(`Job ${jobId} iniciado con datos:`, validatedBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error interno:', error);
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
