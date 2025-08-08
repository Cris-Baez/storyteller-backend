import { PrismaClient, User, Subscription, Usage, Profile, Preferences, $Enums } from '../../generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export type { User, Subscription, Usage, Profile, Preferences } from '../../generated/prisma/index.js';
export type Role = $Enums.Role;
export type Plan = $Enums.Plan;
export type SubscriptionStatus = $Enums.SubscriptionStatus;

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export interface UserWithRelations extends User {
  subscription?: Subscription | null;
  usage?: Usage | null;
  profile?: Profile | null;
  preferences?: Preferences | null;
}

/**
 * 🔐 SERVICIO DE USUARIO CON PRISMA
 */
export class UserService {
  
  /**
   * 🔐 HASH DE CONTRASEÑA
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * 🔑 VERIFICAR CONTRASEÑA
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 👤 CREAR USUARIO COMPLETO
   */
  static async createUser(data: CreateUserData): Promise<UserWithRelations> {
    const hashedPassword = await this.hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
        
        // Crear relaciones por defecto
        usage: {
          create: {
            videosThisWeek: 0,
            weekResetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        subscription: {
          create: {
            status: 'INACTIVE'
          }
        },
        profile: {
          create: {}
        },
        preferences: {
          create: {}
        }
      },
      include: {
        subscription: true,
        usage: true,
        profile: true,
        preferences: true
      }
    });

    return user;
  }

  /**
   * 📧 BUSCAR USUARIO POR EMAIL
   */
  static async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        usage: true,
        profile: true,
        preferences: true
      }
    });
  }

  /**
   * 🆔 BUSCAR USUARIO POR ID
   */
  static async findById(id: number): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        usage: true,
        profile: true,
        preferences: true
      }
    });
  }

  /**
   * 🔄 ACTUALIZAR USUARIO
   */
  static async updateUser(id: number, data: any): Promise<UserWithRelations> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        subscription: true,
        usage: true,
        profile: true,
        preferences: true
      }
    });
  }

  /**
   * 🔒 GENERAR TOKEN DE RESET
   */
  static async generatePasswordResetToken(email: string): Promise<string | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    return resetToken;
  }

  /**
   * 🔑 RESETEAR CONTRASEÑA
   */
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) return false;

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return true;
  }

  /**
   * ✉️ VERIFICAR EMAIL
   */
  static async verifyEmail(token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token }
    });

    if (!user) return false;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null
      }
    });

    return true;
  }

  /**
   * 💳 VERIFICAR SUSCRIPCIÓN ACTIVA
   */
  static isSubscriptionActive(user: UserWithRelations): boolean {
    if (user.plan === 'STARTER') return true; // Plan gratuito siempre activo
    
    if (!user.subscription) return false;
    
    return user.subscription.status === 'ACTIVE' && 
           user.subscription.currentPeriodEnd !== null &&
           new Date(user.subscription.currentPeriodEnd) > new Date();
  }

  /**
   * 🎬 VERIFICAR SI PUEDE CREAR VIDEOS
   */
  static async canCreateVideo(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.usage) return false;

    // Verificar suscripción activa
    if (!this.isSubscriptionActive(user)) return false;

    // Resetear contador si pasó la semana
    if (new Date() > new Date(user.usage.weekResetDate)) {
      await this.resetWeeklyUsage(userId);
      return true;
    }

    const limits: { [key in Plan]: number } = {
      STARTER: 1,
      CREATOR: 5,
      STUDIO_PRO: Infinity
    };

    return user.usage.videosThisWeek < (limits[user.plan] || 0);
  }

  /**
   * 📈 INCREMENTAR USO SEMANAL
   */
  static async incrementWeeklyUsage(userId: number): Promise<void> {
    await prisma.usage.update({
      where: { userId },
      data: {
        videosThisWeek: {
          increment: 1
        }
      }
    });
  }

  /**
   * 🔄 RESETEAR USO SEMANAL
   */
  static async resetWeeklyUsage(userId: number): Promise<void> {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await prisma.usage.update({
      where: { userId },
      data: {
        videosThisWeek: 0,
        weekResetDate: nextWeek
      }
    });
  }

  /**
   * 🔄 ACTUALIZAR ÚLTIMO LOGIN
   */
  static async updateLastLogin(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }
}

export { prisma };
