import express from 'express';
import EditorController from '../controllers/editorController.js';

const router = express.Router();

// Proyectos
router.post('/projects', EditorController.createProject);
router.post('/projects/agent', EditorController.createProjectFromAgent); // ✅ nuevo
router.get('/projects', EditorController.listProjects);
router.get('/projects/:id', EditorController.getProjectById);
router.put('/projects/:id', EditorController.updateProject);
router.delete('/projects/:id', EditorController.deleteProject);
router.post('/projects/:id/duplicate', EditorController.duplicateProject);

// Timeline
router.post('/projects/:id/timeline/add-clip', EditorController.addClip);     // ✅ nuevo
router.put('/projects/:id/timeline/move-clip', EditorController.moveClip);    // ✅ nuevo
router.delete('/projects/:id/timeline/remove-clip', EditorController.removeClip); // ✅ nuevo

// Assets
router.get('/assets', EditorController.listAssets);
router.post('/assets', EditorController.addAsset);
router.delete('/assets/:id', EditorController.deleteAsset);

// Estadísticas
router.get('/stats', EditorController.getEditorStats);

// Audio
router.post('/regenerate-voice', EditorController.regenerateVoice);
router.put('/projects/:id/audio-mix', EditorController.updateAudioMix);
router.post('/projects/:id/add-sfx', EditorController.addSoundEffect);

export default router;
