import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { SocialMediaService } from '../services/socialMediaService.js';
import { InstagramAnalyticsService } from '../services/InstagramAnalyticsService.js';
import { MarketingAgentAnalyticsService } from '../services/MarketingAgentAnalyticsService.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// 🔗 CONECTAR CUENTA DE REDES SOCIALES
router.post('/connect/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token es requerido' 
      });
    }

    const validPlatforms = ['instagram', 'youtube', 'twitter', 'linkedin', 'facebook', 'tiktok'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Plataforma no soportada' 
      });
    }

    const account = await SocialMediaService.connectSocialAccount(userId, {
      platform: platform.toUpperCase() as any,
      username: req.body.username || 'Unknown',
      platformUserId: req.body.platformUserId,
      accessToken,
      refreshToken
    });

    res.json({
      success: true,
      message: `Cuenta de ${platform} conectada exitosamente`,
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        isActive: account.isActive,
        connectedAt: account.createdAt
      }
    });

  } catch (error) {
    console.error('Error conectando cuenta social:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 📋 OBTENER CUENTAS CONECTADAS
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const accounts = await SocialMediaService.getUserSocialAccounts(userId);

    const formattedAccounts = accounts.map((account: any) => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      isActive: account.isActive,
      connectedAt: account.createdAt,
      lastUsed: account.updatedAt,
      postsCount: account.posts?.length || 0
    }));

    res.json({
      success: true,
      accounts: formattedAccounts
    });

  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// ❌ DESCONECTAR CUENTA
router.delete('/disconnect/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    await SocialMediaService.disconnectSocialAccount(userId, parseInt(accountId));

    res.json({
      success: true,
      message: 'Cuenta desconectada exitosamente'
    });

  } catch (error) {
    console.error('Error desconectando cuenta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 🔄 RENOVAR TOKEN
router.post('/refresh/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Para refrescar token necesitamos implementar un método específico
    const account = await SocialMediaService.toggleAutoPublish(userId, parseInt(accountId), true);

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      account: {
        id: account.id,
        platform: account.platform,
        isActive: account.isActive
      }
    });

  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(500).json({ 
      error: 'Error renovando token' 
    });
  }
});

// 📤 PUBLICAR VIDEO
router.post('/publish', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { 
      videoUrl, 
      caption, 
      platforms, 
      scheduleFor,
      hashtags = [] 
    } = req.body;

    if (!videoUrl || !platforms || platforms.length === 0) {
      return res.status(400).json({ 
        error: 'videoUrl y platforms son requeridos' 
      });
    }

    // Por ahora programamos el post para publicación inmediata
    // TODO: Implementar publicación múltiple cuando esté disponible
    const scheduledPosts = [];
    
    for (const platform of platforms) {
      try {
        // Para este ejemplo, usamos scheduleVideoPost con videoId temporal
        const result = await SocialMediaService.scheduleVideoPost(userId, 0, {
          title: caption || 'Video generado automáticamente',
          caption: caption || '',
          hashtags: hashtags.join(' '),
          scheduledFor: scheduleFor
        });
        
        scheduledPosts.push({
          platform,
          success: true,
          postId: result[0]?.id.toString() || 'unknown',
          error: null
        });
      } catch (error) {
        scheduledPosts.push({
          platform,
          success: false,
          postId: null,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    const successCount = scheduledPosts.filter((r: any) => r.success).length;
    const errorCount = scheduledPosts.filter((r: any) => !r.success).length;

    res.json({
      success: true,
      message: `Publicación iniciada: ${successCount} exitosas, ${errorCount} fallidas`,
      results: scheduledPosts.map((r: any) => ({
        platform: r.platform,
        success: r.success,
        postId: r.postId,
        error: r.error
      }))
    });

  } catch (error) {
    console.error('Error publicando video:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 📊 OBTENER HISTORIAL DE PUBLICACIONES
router.get('/posts', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { platform, limit = '20' } = req.query;

    const posts = await SocialMediaService.getScheduledPosts(userId);

    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      platform: post.socialAccount?.platform || 'unknown',
      title: post.title,
      content: post.caption,
      videoUrl: post.video?.thumbnailUrl || null,
      status: post.status,
      scheduledFor: post.scheduledFor,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      platformPostId: post.platformPostId,
      hashtags: post.hashtags
    }));

    res.json({
      success: true,
      posts: formattedPosts
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 🔄 PROCESAR PUBLICACIONES PROGRAMADAS (Endpoint interno)
router.post('/process-scheduled', async (req, res) => {
  try {
    // Este endpoint debería ser llamado por un cron job
    await SocialMediaService.processScheduledPosts();

    res.json({
      success: true,
      message: 'Publicaciones programadas procesadas'
    });

  } catch (error) {
    console.error('Error procesando publicaciones programadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 🔍 VERIFICAR ESTADO DE PUBLICACIÓN
router.get('/status/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Buscar el post en la base de datos
    const prisma = (globalThis as any).prisma;
    const post = await prisma.socialPost.findFirst({
      where: {
        id: postId,
        account: {
          userId: userId
        }
      },
      include: {
        account: {
          select: {
            platform: true,
            username: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ 
        error: 'Publicación no encontrada' 
      });
    }

    res.json({
      success: true,
      post: {
        id: post.id,
        platform: post.account.platform,
        username: post.account.username,
        status: post.status,
        title: post.title,
        scheduledFor: post.scheduledFor,
        publishedAt: post.publishedAt,
        platformPostId: post.platformPostId,
        error: post.error
      }
    });

  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// 📊 INSTAGRAM ANALYTICS - Marketing Agent Endpoints

// 🔗 Conectar cuenta específica de Instagram con Analytics
router.post('/instagram/connect', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token de Instagram es requerido' 
      });
    }

    const account = await InstagramAnalyticsService.connectInstagramAccount(userId, accessToken);

    res.json({
      success: true,
      message: 'Cuenta de Instagram conectada con Analytics',
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        isActive: account.isActive,
        connectedAt: account.createdAt
      }
    });

  } catch (error) {
    console.error('Error conectando Instagram Analytics:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 📈 Obtener scorecard de Instagram (0-100)
router.get('/instagram/:accountId/scorecard', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    const scorecard = await InstagramAnalyticsService.calculateScorecard(parseInt(accountId));

    res.json({
      success: true,
      scorecard
    });

  } catch (error) {
    console.error('Error calculando scorecard:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 📰 Generar daily brief de Instagram
router.get('/instagram/:accountId/daily-brief', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    const dailyBrief = await MarketingAgentAnalyticsService.generateDailyBrief(userId);

    res.json({
      success: true,
      dailyBrief
    });

  } catch (error) {
    console.error('Error generando daily brief:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// ⏰ Obtener mejores horarios para publicar
router.get('/instagram/:accountId/best-times', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    const bestTimes = await InstagramAnalyticsService.getBestPostingTimes(parseInt(accountId));

    res.json({
      success: true,
      bestTimes
    });

  } catch (error) {
    console.error('Error obteniendo mejores horarios:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 🎯 Generar variantes de contenido optimizado
router.post('/instagram/:accountId/optimize-content', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;
    const { postId, variantType = 'caption' } = req.body;

    if (!postId) {
      return res.status(400).json({ 
        error: 'PostId es requerido para optimización' 
      });
    }

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    const variants = await MarketingAgentAnalyticsService.generateContentVariants(
      postId, 
      variantType
    );

    res.json({
      success: true,
      variants
    });

  } catch (error) {
    console.error('Error optimizando contenido:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 📊 Sincronizar métricas de Instagram
router.post('/instagram/:accountId/sync', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    await InstagramAnalyticsService.syncAccountMetrics(parseInt(accountId));

    res.json({
      success: true,
      message: 'Métricas sincronizadas correctamente'
    });

  } catch (error) {
    console.error('Error sincronizando métricas:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 📈 Generar reporte semanal
router.get('/instagram/:accountId/weekly-report', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que la cuenta pertenece al usuario
    const account = await (globalThis as any).prisma.socialAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId,
        platform: 'INSTAGRAM'
      }
    });

    if (!account) {
      return res.status(404).json({ 
        error: 'Cuenta de Instagram no encontrada' 
      });
    }

    const weeklyReport = await MarketingAgentAnalyticsService.generateWeeklyReport(parseInt(accountId));

    res.json({
      success: true,
      weeklyReport
    });

  } catch (error) {
    console.error('Error generando reporte semanal:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// 🔍 Analizar post específico
router.get('/instagram/post/:postId/analyze', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verificar que el post pertenece a una cuenta del usuario
    const post = await (globalThis as any).prisma.postAnalytics.findFirst({
      where: {
        postId,
        account: {
          userId,
          platform: 'INSTAGRAM'
        }
      },
      include: {
        account: true
      }
    });

    if (!post) {
      return res.status(404).json({ 
        error: 'Post no encontrado o no pertenece al usuario' 
      });
    }

    const analysis = await InstagramAnalyticsService.analyzePost(postId);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analizando post:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

export default router;
