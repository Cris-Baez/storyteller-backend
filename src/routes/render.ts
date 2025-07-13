import { Router } from 'express';
import { runRenderPipeline } from '../pipelines/renderPipeline.js';
import { RenderRequest } from '../utils/types.js';

export const renderRouter = Router();

renderRouter.post('/', async (req, res) => {
  try {
    const body = req.body as RenderRequest;
    if (!body.prompt) return res.status(400).json({ error: 'Missing prompt' });
    const result = await runRenderPipeline(body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
