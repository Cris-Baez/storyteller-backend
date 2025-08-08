import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserService, CreateUserData, UserWithRelations } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private readonly JWT_SECRET = env.JWT_SECRET || 'fallback_secret_key_change_in_production';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * 🔐 REGISTRO DE NUEVO USUARIO
   */
  async register(data: RegisterData): Promise<{ user: UserWithRelations; tokens: AuthTokens }> {
    logger.info(`[AuthService] 📝 Registrando nuevo usuario: ${data.email}`);

    try {
      // Crear nuevo usuario usando UserService
      const user = await UserService.createUser(data);

      // Generar tokens
      const tokens = this.generateTokens(user.id.toString());

      // Actualizar último login
      await UserService.updateLastLogin(user.id);

      logger.info(`[AuthService] ✅ Usuario registrado exitosamente: ${data.email}`);

      // TODO: Enviar email de verificación
      // await this.sendVerificationEmail(user.email, user.emailVerificationToken);

      return { user, tokens };

    } catch (error) {
      logger.error(`[AuthService] ❌ Error en registro:`, error);
      throw error;
    }
  }

  /**
   * 🔑 LOGIN DE USUARIO
   */
  async login(data: LoginData): Promise<{ user: UserWithRelations; tokens: AuthTokens }> {
    logger.info(`[AuthService] 🔑 Intento de login: ${data.email}`);

    try {
      // Buscar usuario por email
      const user = await UserService.findByEmail(data.email);
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await UserService.comparePassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Generar tokens
      const tokens = this.generateTokens(user.id.toString());

      // Actualizar último login
      await UserService.updateLastLogin(user.id);

      logger.info(`[AuthService] ✅ Login exitoso: ${data.email}`);

      return { user, tokens };

    } catch (error) {
      logger.error(`[AuthService] ❌ Error en login:`, error);
      throw error;
    }
  }

  /**
   * 🔄 REFRESCAR TOKEN
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      // Verificar que el usuario existe
      const user = await UserService.findById(parseInt(decoded.userId));
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevos tokens
      return this.generateTokens(user.id.toString());

    } catch (error) {
      logger.error(`[AuthService] ❌ Error refrescando token:`, error);
      throw new Error('Token de refresco inválido');
    }
  }

  /**
   * 👤 OBTENER USUARIO POR TOKEN
   */
  async getUserFromToken(token: string): Promise<UserWithRelations | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = await UserService.findById(parseInt(decoded.userId));
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔒 SOLICITAR RESET DE CONTRASEÑA
   */
  async requestPasswordReset(email: string): Promise<void> {
    logger.info(`[AuthService] 🔒 Solicitud de reset de contraseña: ${email}`);

    try {
      const resetToken = await UserService.generatePasswordResetToken(email);
      if (!resetToken) {
        // Por seguridad, no revelamos si el email existe
        return;
      }

      // TODO: Enviar email con token de reset
      // await this.sendPasswordResetEmail(email, resetToken);

      logger.info(`[AuthService] ✅ Token de reset generado para: ${email}`);

    } catch (error) {
      logger.error(`[AuthService] ❌ Error en solicitud de reset:`, error);
      throw error;
    }
  }

  /**
   * 🔑 RESETEAR CONTRASEÑA
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    logger.info(`[AuthService] 🔑 Intento de reset de contraseña`);

    try {
      const success = await UserService.resetPassword(token, newPassword);
      if (!success) {
        throw new Error('Token de reset inválido o expirado');
      }

      logger.info(`[AuthService] ✅ Contraseña reseteada exitosamente`);

    } catch (error) {
      logger.error(`[AuthService] ❌ Error en reset de contraseña:`, error);
      throw error;
    }
  }

  /**
   * ✉️ VERIFICAR EMAIL
   */
  async verifyEmail(token: string): Promise<void> {
    logger.info(`[AuthService] ✉️ Verificación de email`);

    try {
      const success = await UserService.verifyEmail(token);
      if (!success) {
        throw new Error('Token de verificación inválido');
      }

      logger.info(`[AuthService] ✅ Email verificado exitosamente`);

    } catch (error) {
      logger.error(`[AuthService] ❌ Error en verificación de email:`, error);
      throw error;
    }
  }

  /**
   * 🎫 GENERAR TOKENS JWT
   */
  private generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * 📧 ENVIAR EMAIL DE VERIFICACIÓN (TODO)
   */
  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // TODO: Implementar envío de email
    // const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    logger.info(`[AuthService] 📧 Envío de email de verificación pendiente para: ${email}`);
  }

  /**
   * 📧 ENVIAR EMAIL DE RESET (TODO)
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // TODO: Implementar envío de email
    // const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    logger.info(`[AuthService] 📧 Envío de email de reset pendiente para: ${email}`);
  }
}
