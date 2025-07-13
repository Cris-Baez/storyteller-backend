import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api/render', renderRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Storyteller AI backend running on ${PORT}`));
