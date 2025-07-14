import RunwayML from '@runwayml/sdk';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const runwayClient = new RunwayML();

/**
 * Crea una tarea de video upscale usando RunwayML.
 * @param {"upscale_v1"} model - Modelo a utilizar (e.g., 'upscale_v1').
 * @param {string} videoUri - URI del video a procesar.
 * @returns {Promise<any>} - Resultado de la tarea.
 */
export async function createVideoUpscaleTask(model: "upscale_v1", videoUri: string): Promise<any> {
  try {
    const task = await runwayClient.videoUpscale
      .create({
        model,
        videoUri,
      })
      .waitForTaskOutput();

    logger.info(`RunwayML task completed: ${JSON.stringify(task)}`);
    return task;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`RunwayML error: ${err.message}`);
    throw new Error('Failed to create video upscale task');
  }
}
