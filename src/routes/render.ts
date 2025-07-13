import express from 'express';
import { startJob, getJobStatus, getJobResult } from '../jobs/jobQueue.js';

export const renderRouter = express.Router();

// 1. Enviar trabajo
renderRouter.post('/', async (req, res) => {
  const { prompt, style, type, duration } = req.body;

  const jobId = await startJob({ prompt, style, type, duration });

  res.status(202).json({
    status: 'processing',
    jobId,
  });
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
