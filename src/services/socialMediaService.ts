import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface SocialAccountData {
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TWITTER' | 'LINKEDIN' | 'FACEBOOK' | 'TIKTOK';
  username: string;
  platformUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  settings?: any;
}

export interface PostData {
  title?: string;
  caption?: string;
  hashtags?: string;
  scheduledFor?: Date;
}

/**
 * 📱 SERVICIO DE REDES SOCIALES
 * Maneja las conexiones y publicaciones automáticas en redes sociales
 */
export class SocialMediaService {
  
  /**
   * Obtener todas las cuentas sociales de un usuario
   */
  static async getUserSocialAccounts(userId: number) {
    try {
      return await prisma.socialAccount.findMany({
        where: { userId },
        include: {
          posts: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo cuentas sociales:', error);
      throw new Error('Error al obtener cuentas sociales');
    }
  }

  /**
   * Conectar una nueva cuenta social
   */
  static async connectSocialAccount(userId: number, accountData: SocialAccountData) {
    try {
      const existingAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: accountData.platform
          }
        }
      });

      if (existingAccount) {
        // Actualizar cuenta existente
        return await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            username: accountData.username,
            platformUserId: accountData.platformUserId,
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            tokenExpiry: accountData.tokenExpiry,
            settings: accountData.settings,
            isActive: true
          }
        });
      } else {
        // Crear nueva cuenta
        return await prisma.socialAccount.create({
          data: {
            userId,
            ...accountData
          }
        });
      }
    } catch (error) {
      logger.error('Error conectando cuenta social:', error);
      throw new Error('Error al conectar cuenta social');
    }
  }

  /**
   * Desconectar una cuenta social
   */
  static async disconnectSocialAccount(userId: number, accountId: number) {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { 
          id: accountId,
          userId 
        }
      });

      if (!account) {
        throw new Error('Cuenta social no encontrada');
      }

      return await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          isActive: false,
          autoPublish: false,
          accessToken: null,
          refreshToken: null
        }
      });
    } catch (error) {
      logger.error('Error desconectando cuenta social:', error);
      throw new Error('Error al desconectar cuenta social');
    }
  }

  /**
   * Activar/desactivar publicación automática
   */
  static async toggleAutoPublish(userId: number, accountId: number, autoPublish: boolean) {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { 
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        throw new Error('Cuenta social no encontrada o inactiva');
      }

      return await prisma.socialAccount.update({
        where: { id: accountId },
        data: { autoPublish }
      });
    } catch (error) {
      logger.error('Error actualizando auto-publicación:', error);
      throw new Error('Error al actualizar configuración');
    }
  }

  /**
   * Programar publicación automática de un video
   */
  static async scheduleVideoPost(userId: number, videoId: number, postData?: PostData) {
    try {
      // Obtener cuentas activas con auto-publicación habilitada
      const activeAccounts = await prisma.socialAccount.findMany({
        where: {
          userId,
          isActive: true,
          autoPublish: true
        }
      });

      if (activeAccounts.length === 0) {
        logger.info('No hay cuentas activas para auto-publicación');
        return [];
      }

      // Obtener datos del video
      const video = await prisma.video.findFirst({
        where: { 
          id: videoId,
          userId 
        }
      });

      if (!video) {
        throw new Error('Video no encontrado');
      }

      const scheduledPosts = [];

      // Crear publicaciones programadas para cada cuenta activa
      for (const account of activeAccounts) {
        const defaultCaption = this.generateDefaultCaption(video, account.platform);
        
        const post = await prisma.socialPost.create({
          data: {
            socialAccountId: account.id,
            videoId: video.id,
            title: postData?.title || video.title,
            caption: postData?.caption || defaultCaption,
            hashtags: postData?.hashtags || this.generateHashtags(video, account.platform),
            scheduledFor: postData?.scheduledFor || new Date(Date.now() + 5 * 60 * 1000), // 5 minutos por defecto
            status: 'SCHEDULED'
          }
        });

        scheduledPosts.push(post);
      }

      logger.info(`Video programado para ${scheduledPosts.length} cuentas sociales`);
      return scheduledPosts;

    } catch (error) {
      logger.error('Error programando publicaciones:', error);
      throw new Error('Error al programar publicaciones');
    }
  }

  /**
   * Obtener publicaciones programadas de un usuario
   */
  static async getScheduledPosts(userId: number) {
    try {
      return await prisma.socialPost.findMany({
        where: {
          socialAccount: {
            userId
          },
          status: {
            in: ['PENDING', 'SCHEDULED']
          }
        },
        include: {
          socialAccount: true,
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: {
          scheduledFor: 'asc'
        }
      });
    } catch (error) {
      logger.error('Error obteniendo publicaciones programadas:', error);
      throw new Error('Error al obtener publicaciones programadas');
    }
  }

  /**
   * Procesar cola de publicaciones (para cron job)
   */
  static async processScheduledPosts() {
    try {
      const now = new Date();
      
      const postsToPublish = await prisma.socialPost.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: {
            lte: now
          }
        },
        include: {
          socialAccount: true,
          video: true
        }
      });

      logger.info(`Procesando ${postsToPublish.length} publicaciones programadas`);

      for (const post of postsToPublish) {
        try {
          await this.publishPost(post);
        } catch (error) {
          logger.error(`Error publicando post ${post.id}:`, error);
          
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Error desconocido'
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error procesando publicaciones programadas:', error);
    }
  }

  /**
   * Publicar un post específico
   */
  private static async publishPost(post: any) {
    // Actualizar estado a "publicando"
    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'PUBLISHING' }
    });

    // Aquí iría la lógica específica para cada plataforma
    // Por ahora simulamos la publicación
    switch (post.socialAccount.platform) {
      case 'INSTAGRAM':
        await this.publishToInstagram(post);
        break;
      case 'YOUTUBE':
        await this.publishToYouTube(post);
        break;
      case 'TWITTER':
        await this.publishToTwitter(post);
        break;
      case 'LINKEDIN':
        await this.publishToLinkedIn(post);
        break;
      case 'FACEBOOK':
        await this.publishToFacebook(post);
        break;
      case 'TIKTOK':
        await this.publishToTikTok(post);
        break;
      default:
        throw new Error(`Plataforma no soportada: ${post.socialAccount.platform}`);
    }

    // Marcar como publicado
    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        platformPostId: `simulated_${post.id}_${Date.now()}`
      }
    });

    logger.info(`Post ${post.id} publicado exitosamente en ${post.socialAccount.platform}`);
  }

  // Métodos de publicación por plataforma (simulados)
  private static async publishToInstagram(post: any) {
    // TODO: Integrar con Instagram Basic Display API
    logger.info('Publicando en Instagram (simulado)');
  }

  private static async publishToYouTube(post: any) {
    // TODO: Integrar con YouTube Data API
    logger.info('Publicando en YouTube (simulado)');
  }

  private static async publishToTwitter(post: any) {
    // TODO: Integrar con Twitter API v2
    logger.info('Publicando en Twitter (simulado)');
  }

  private static async publishToLinkedIn(post: any) {
    // TODO: Integrar con LinkedIn API
    logger.info('Publicando en LinkedIn (simulado)');
  }

  private static async publishToFacebook(post: any) {
    // TODO: Integrar con Facebook Graph API
    logger.info('Publicando en Facebook (simulado)');
  }

  private static async publishToTikTok(post: any) {
    // TODO: Integrar con TikTok API
    logger.info('Publicando en TikTok (simulado)');
  }

  /**
   * Generar caption por defecto según la plataforma
   */
  private static generateDefaultCaption(video: any, platform: string): string {
    const baseCaption = `🎬 ${video.title}`;
    
    switch (platform) {
      case 'INSTAGRAM':
        return `${baseCaption} ✨\n\nCreado con inteligencia artificial 🤖\n\n#video #ai #contenido #marketing`;
      case 'YOUTUBE':
        return `${baseCaption}\n\nVideo generado con tecnología de inteligencia artificial. Descubre cómo crear contenido profesional de forma automática.`;
      case 'TWITTER':
        return `${baseCaption} 🤖✨ #VideoIA #Marketing #Contenido`;
      case 'LINKEDIN':
        return `${baseCaption}\n\nLa inteligencia artificial está revolucionando la creación de contenido. Este video fue generado automáticamente usando tecnología de vanguardia.`;
      case 'FACEBOOK':
        return `${baseCaption} 🎥\n\n¿Sabías que este video fue creado completamente con inteligencia artificial? La tecnología de hoy permite crear contenido profesional en minutos.`;
      case 'TIKTOK':
        return `${baseCaption} 🤖✨ #IA #Video #Tecnología`;
      default:
        return baseCaption;
    }
  }

  /**
   * Generar hashtags según la plataforma
   */
  private static generateHashtags(video: any, platform: string): string {
    const commonTags = ['#video', '#ai', '#contenido'];
    
    switch (platform) {
      case 'INSTAGRAM':
        return [...commonTags, '#marketing', '#creatividad', '#tecnologia', '#emprendimiento'].join(' ');
      case 'TWITTER':
        return [...commonTags, '#VideoIA', '#Marketing', '#Tech'].join(' ');
      case 'LINKEDIN':
        return [...commonTags, '#inteligenciaartificial', '#marketing', '#negociodigital'].join(' ');
      case 'TIKTOK':
        return [...commonTags, '#IA', '#fyp', '#viral', '#tecnología'].join(' ');
      default:
        return commonTags.join(' ');
    }
  }
}

export default SocialMediaService;
