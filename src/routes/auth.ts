import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN
 */

// 📝 Registro de usuario
router.post('/register', authController.register);

// 🔑 Login de usuario  
router.post('/login', authController.login);

// 🔄 Refrescar token
router.post('/refresh-token', authController.refreshToken);

// 🔒 Solicitar reset de contraseña
router.post('/request-password-reset', authController.requestPasswordReset);

// 🔑 Resetear contraseña
router.post('/reset-password', authController.resetPassword);

// ✉️ Verificar email
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * 🔒 RUTAS PROTEGIDAS (requieren autenticación)
 */

// 👤 Obtener perfil del usuario autenticado
router.get('/profile', authenticate, authController.getProfile);

// 📝 Actualizar perfil del usuario autenticado
router.put('/profile', authenticate, authController.updateProfile);

// 🚪 Logout (principalmente del lado cliente)
router.post('/logout', authenticate, authController.logout);

export { router as authRouter };
