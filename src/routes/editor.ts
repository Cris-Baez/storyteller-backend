import { Router } from 'express';
import { EditorController } from '../controllers/editorController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * 📁 RUTAS DE PROYECTOS
 */
router.get('/projects', EditorController.getUserProjects);
router.post('/projects', EditorController.createProject);
router.get('/projects/:id', EditorController.getProjectById);
router.put('/projects/:id', EditorController.updateProject);
router.delete('/projects/:id', EditorController.deleteProject);
router.post('/projects/:id/duplicate', EditorController.duplicateProject);

/**
 * 📎 RUTAS DE ASSETS
 */
router.get('/assets', EditorController.getUserAssets);
router.post('/assets', EditorController.addAsset);
router.delete('/assets/:id', EditorController.deleteAsset);

/**
 * 📊 RUTAS DE ESTADÍSTICAS
 */
router.get('/stats', EditorController.getEditorStats);

/**
 * 🎛️ RUTAS DE EDICIÓN DE AUDIO
 */
router.post('/regenerate-voice', EditorController.regenerateVoice);
router.post('/update-audio', EditorController.updateAudio);
router.post('/add-sound-effect', EditorController.addSoundEffect);

export default router;