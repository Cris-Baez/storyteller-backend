# AUTO_DOCS_BACKEND (generado)


Inventario generado automáticamente de archivos, exports y endpoints. Fuente: carpeta src y prisma/schema.prisma.

## Estructura src

### src

- src/index.ts

### src/config

- src/config/cinemaConfig.ts
- src/config/database.ts
  - exports: connectDatabase, disconnectDatabase
- src/config/env.ts
- src/config/plans.ts
  - exports: PLAN_CONFIGS, getPlanConfig, planHasFeature, getPlanLimits

### src/controllers

- src/controllers/adminController.ts
  - exports: AdminController, validateChangeUserPlan, validateUserIdParam, validateVideoIdParam, adminController
- src/controllers/agentController.ts
  - exports: AgentController
- src/controllers/authController.ts
  - exports: register, login, refreshToken, getProfile, updateProfile, requestPasswordReset, resetPassword, verifyEmail, logout
- src/controllers/cleanupController.ts
  - exports: CleanupController
- src/controllers/coherenciaEnhancedController.js
- src/controllers/copywriterProController.ts
  - exports: generatePlatformCopy, generateHooks, generateHPSCAScript, generateCopyVariationsForTesting, optimizeCopy, generateCompleteCopywriterSuite, generateConciergeExample
- src/controllers/editorController-new.ts
- src/controllers/editorController.ts
  - exports: EditorController
- src/controllers/marketingAgentController.ts
  - exports: chatWithAgent, getWelcomeMessage, getConversationHistory, getBusinessContext, updateConversationFeedback, executeSuggestedAction, crearCampa
- src/controllers/marketingConfigController.ts
  - exports: MarketingConfigController, validateUpdateConfig, marketingConfigController
- src/controllers/marketingController.ts
  - exports: MarketingController
- src/controllers/marketingTemplateController.ts
  - exports: MarketingTemplateController, validateTemplateQuery, marketingTemplateController
- src/controllers/subscriptionController.ts
  - exports: createSubscription, getUserActiveSubscription, getUserSubscriptions, getSubscription, cancelSubscription, getUserPlanLimits, checkFeatureAccess, handlePayPalWebhook, getSubscriptionApprovalUrl
- src/controllers/templateController.ts
  - exports: TemplateController, validateCreateTemplate, validateUpdateTemplate, templateController
- src/controllers/testingController.ts
  - exports: testBusinessAnalysis, runValidationSuiteEndpoint, quickTestEndpoint, compareAnalysisEndpoint
- src/controllers/webhookController.ts

### src/examples

- src/examples/videoSegmentadoEjemplo.ts

### src/jobs

- src/jobs/jobQueue.ts
  - exports: startJob, updateJobState, getJobStatus, getJobState, getJobResult, getJobProgress, cleanupOldJobs

### src/middleware

- src/middleware/auth.ts
  - exports: authenticate, authorize, requireActiveSubscription, checkVideoCreationLimits, requireStudioPro, optionalAuth
- src/middleware/coherenciaAutomatic.d.ts
- src/middleware/coherenciaAutomatic.ts
  - exports: coherenciaAutomatica
- src/middleware/coherenciaMiddleware.ts
  - exports: CoherenciaMiddleware, coherenciaMiddleware, aplicarMejorAsCoherencia
- src/middleware/errorHandler.ts
  - exports: errorHandler, notFoundHandler, validateResourceOwnership
- src/middleware/validation.ts
  - exports: validateRequest

### src/models

- src/models/CinemaProject.ts
  - exports: CinemaProjectStore
- src/models/Marketing.ts
  - exports: MarketingVideo
- src/models/MarketingSimple.ts
  - exports: MarketingVideoStore
- src/models/User.ts
  - exports: UserService

### src/pipelines

- src/pipelines/enhancedMarketingPipeline.ts
  - exports: EnhancedMarketingPipeline, enhancedMarketingPipeline
- src/pipelines/marketingPipeline.ts
  - exports: MarketingPipeline
- src/pipelines/marketingPipeline_new.ts
- src/pipelines/renderPipeline.ts
  - exports: renderVideoSimplificado, renderCinemaAI, renderMarketingAI, renderAutomatic

### src/routes

- src/routes/admin.ts
- src/routes/agent.ts
- src/routes/auth.ts
- src/routes/cinemaRoutes.ts
- src/routes/cleanup.ts
- src/routes/copywriterProRoutes.ts
- src/routes/editor-basic.ts
- src/routes/editor.ts
- src/routes/marketingAgentRoutes.ts
- src/routes/marketingConfigRoutes.ts
- src/routes/marketingRoutes.ts
- src/routes/marketingTemplateRoutes.ts
- src/routes/render.ts
  - exports: renderRouter
- src/routes/social.ts
- src/routes/subscriptionRoutes.ts
- src/routes/templateRoutes.ts
- src/routes/templates.ts
- src/routes/testingRoutes.ts
- src/routes/videoRoutes.ts
- src/routes/webhookRoutes.ts

### src/scripts

- src/scripts/setupPayPalPlans.ts
  - exports: setupPayPalPlans

### src/services

- src/services/AlertService.ts
  - exports: AlertService
- src/services/InstagramAnalyticsService.ts
  - exports: InstagramAnalyticsService
- src/services/MarketingAgentAnalyticsService.ts
  - exports: MarketingAgentAnalyticsService
- src/services/adminService.ts
  - exports: AdminService
- src/services/assetManager.ts
  - exports: AssetManager, cargarAssetsIndex, filtrarFondos, filtrarActores
- src/services/audioEngine.ts
  - exports: getAdvancedMusic, getSfx, processAudioForScene, logAudioMetrics
- src/services/audioFallbackService.ts
  - exports: robustAudioGen
- src/services/audioIntegration.ts
  - exports: generarAudioCompleto, validarConfiguracionAudio, obtenerConfiguracionOptima, procesarAudioCompleto
- src/services/authService.ts
  - exports: AuthService
- src/services/cdnService.ts
  - exports: uploadToCDN
- src/services/cinemaProgressService.ts
  - exports: CinemaProgressService
- src/services/cleanupService.ts
  - exports: CleanupService
- src/services/editorService-fixed.ts
- src/services/editorService.ts
  - exports: EditorService
- src/services/elevenlabsFXService.ts
  - exports: elevenlabsFXService, generateFXForVideo, isElevenLabsFXAvailable
- src/services/enhancedMarketingIntelligenceService.ts
  - exports: EnhancedMarketingIntelligenceService
- src/services/feedbackService.ts
  - exports: logFeedback, registerFeedback, getFeedback, applyFeedbackToPlan, clearFeedbackStore
- src/services/ffmpegService.ts
  - exports: assembleVideo
- src/services/freesoundService.ts
  - exports: buscarMusicaCorporativa, buscarEfectosSonidoCorporativos, validarConfiguracionFreesound
- src/services/klingService.ts
  - exports: KlingService, generateKlingClip, generateQuickKlingVideo
- src/services/klingService_backup.ts
  - exports: KlingService, generateKlingClip, generateQuickKlingVideo
- src/services/lipSyncService.ts
  - exports: applyLipSyncToClips, applyLipSyncToPlan, checkLipSyncAvailability
- src/services/marketingAgentService.ts
  - exports: MarketingAgentService, marketingAgent
- src/services/marketingAgentService_fixed.ts
- src/services/marketingConfigService.ts
  - exports: MarketingConfigService
- src/services/marketingIntelligenceService.ts
  - exports: MarketingIntelligenceService
- src/services/marketingTemplateService.ts
  - exports: MARKETING_TEMPLATES, MarketingTemplateService
- src/services/metricsService.ts
- src/services/murfService.ts
  - exports: generarVozComercial, obtenerVocesComerciales, validarConfiguracionMurf, estimarDuracionTexto
- src/services/musicService.ts
  - exports: getBackgroundMusic, getMusicById, getMusicLibrary
- src/services/paypalService.ts
  - exports: paypalService
- src/services/planLimitService.ts
  - exports: PlanLimitService
- src/services/runwayService.ts
- src/services/sadtalkerService.ts
  - exports: runSadTalker, applySadTalker
- src/services/sceneAudioService.ts
  - exports: generateSceneAudio, generateBatchSceneAudio, syncAudioWithVideoClips, generateUnifiedAudioForPipeline
- src/services/searchAsset.ts
  - exports: findBestAsset, findAssets
- src/services/socialMediaService.ts
  - exports: SocialMediaService
- src/services/subscriptionService.ts
  - exports: subscriptionService
- src/services/templateService.ts
  - exports: TemplateService
- src/services/video.ts
- src/services/voiceInterceptor.d.ts
- src/services/voiceInterceptor.ts
  - exports: voiceInterceptor
- src/services/voiceService.ts
  - exports: pickVoiceId, createVoiceBuffer, createVoiceOver, createMarketingVoiceBuffer
- src/services/wav2lipService.ts
  - exports: runWav2Lip, applyWav2Lip

### src/services/agentMemory

- src/services/agentMemory/memorySystem.ts
  - exports: MemorySystem, generateId, memoryManager

### src/services/conversationalAgent

- src/services/conversationalAgent/marketingAgent.ts
  - exports: MarketingConversationalAgent, marketingAgent

### src/services/llmService

- src/services/llmService/adaptador-cerebros.ts
  - exports: adaptarCerebrosAVideoPlan, debugAdaptador
- src/services/llmService/dispatcher.ts
  - exports: dispatchCerebros, analizarRequest
- src/services/llmService/extractJsonUtil.ts
  - exports: extractFirstJsonBlock
- src/services/llmService/index.ts
- src/services/llmService/openRouterUtil.ts
  - exports: callOpenRouter
- src/services/llmService/restricciones.ts
  - exports: RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO, getEstiloLimitaciones, validarDuracionClip, getCameraMovement, getTransicion, getEfecto

### src/services/llmService/estilos/anime

- src/services/llmService/estilos/anime/actores.ts
  - exports: seleccionarActorAnime
- src/services/llmService/estilos/anime/arte.ts
  - exports: decidirArteConIA, seleccionarFondoAnime
- src/services/llmService/estilos/anime/director.ts
  - exports: generarNarrativaAnime, aplicarEstructuraNarrativa
- src/services/llmService/estilos/anime/editor.ts
  - exports: configurarEdicionAnime, aplicarEstructuraEdicion, optimizarFlujoAnime
- src/services/llmService/estilos/anime/fotografia.ts
  - exports: configurarCamaraAnime
- src/services/llmService/estilos/anime/orquestador.ts
  - exports: orquestarEquipoCinematico, validarPlanCinematico
- src/services/llmService/estilos/anime/sonido.ts
  - exports: configurarSonidoAnime

### src/services/llmService/estilos/cartoon

- src/services/llmService/estilos/cartoon/actores.ts
  - exports: seleccionarActorCartoon
- src/services/llmService/estilos/cartoon/arte.ts
  - exports: seleccionarFondoCartoon
- src/services/llmService/estilos/cartoon/director.ts
  - exports: generarNarrativaCartoon
- src/services/llmService/estilos/cartoon/editor.ts
  - exports: configurarEdicionCartoon, aplicarEstructuraEdicion, optimizarFlujoCartoon
- src/services/llmService/estilos/cartoon/fotografia.ts
  - exports: configurarCamaraCartoon
- src/services/llmService/estilos/cartoon/orquestador.ts
  - exports: orquestarEquipoCinematico, validarPlanCinematico
- src/services/llmService/estilos/cartoon/sonido.ts
  - exports: configurarSonidoCartoon

### src/services/llmService/estilos/cinematic

- src/services/llmService/estilos/cinematic/actores.ts
  - exports: seleccionarActorCinematico
- src/services/llmService/estilos/cinematic/arte.ts
  - exports: decidirArteConIA, seleccionarFondoCinematico, aplicarEstilizacionCinematica
- src/services/llmService/estilos/cinematic/director.ts
  - exports: generarNarrativaCinematica, aplicarEstructuraNarrativa
- src/services/llmService/estilos/cinematic/editor.ts
  - exports: configurarEdicionCinematica, aplicarEstructuraEdicion, optimizarFlujoCinematico
- src/services/llmService/estilos/cinematic/fotografia.ts
  - exports: configurarFotografiaConIA, configurarCamaraCinematica, aplicarEstiloFotograficoCinematico
- src/services/llmService/estilos/cinematic/orquestador.ts
  - exports: orquestarEquipoCinematico, validarPlanCinematico
- src/services/llmService/estilos/cinematic/sonido.ts
  - exports: configurarSonidoConIA, configurarSonidoCinematico, aplicarConfiguracionAudioCinematica

### src/services/llmService/estilos/commercial

- src/services/llmService/estilos/commercial/actores.ts
  - exports: seleccionarActorCommercial
- src/services/llmService/estilos/commercial/arte.ts
  - exports: seleccionarFondoCommercial, seleccionarActorCommercial, configurarCamaraCommercial, configurarSonidoCommercial, configurarEdicionCommercial, aplicarEstructuraEdicion, optimizarFlujoCommercial
- src/services/llmService/estilos/commercial/director.ts
  - exports: generarNarrativaCommercial
- src/services/llmService/estilos/commercial/editor.ts
  - exports: configurarEdicionCommercial, aplicarEstructuraEdicion, optimizarFlujoCommercial
- src/services/llmService/estilos/commercial/fotografia.ts
  - exports: configurarCamaraCommercial
- src/services/llmService/estilos/commercial/orquestador.ts
  - exports: orquestarEquipoCinematico, validarPlanCinematico
- src/services/llmService/estilos/commercial/sonido.ts
  - exports: configurarSonidoCommercial

### src/services/llmService/estilos/marketing

- src/services/llmService/estilos/marketing/advancedOrchestrator.ts
- src/services/llmService/estilos/marketing/advancedOrchestratorPhase2.ts
- src/services/llmService/estilos/marketing/agenteMarketing.ts
  - exports: procesarSolicitudCompleta
- src/services/llmService/estilos/marketing/analysisValidator.ts
  - exports: runValidationTest, VALIDATION_TEST_CASES, runFullValidationSuite
- src/services/llmService/estilos/marketing/businessAnalyst.ts
  - exports: analyzeBusinessFromImages, updateBusinessAnalysis
- src/services/llmService/estilos/marketing/contentStrategist.ts
  - exports: createCompleteStrategy, adaptStrategyForPlatform
- src/services/llmService/estilos/marketing/conversionOptimizer.ts
- src/services/llmService/estilos/marketing/copywriterPro.ts
  - exports: generateVideoScript, generateCopyVariations, generatePlatformSpecificCopy, generatePsychologicalHooks, optimizeCopyForConversion
- src/services/llmService/estilos/marketing/copywriterProAdvanced.ts
- src/services/llmService/estilos/marketing/creativeDirector.ts
  - exports: convertirImagenesEstaticasADinamicas, createCreativeDirection, refineCreativeDirection
- src/services/llmService/estilos/marketing/dualEngineOrchestrator.ts
- src/services/llmService/estilos/marketing/dualEngineWrapper.ts
- src/services/llmService/estilos/marketing/editorIntegration.ts
- src/services/llmService/estilos/marketing/generadorVideoAgente.ts
  - exports: generarVideoDesdeAgenteMarketing, generarAudioComercial, ensamblarVideoComercial
- src/services/llmService/estilos/marketing/imagePreAnalyzer.ts
  - exports: preAnalyzeImages, convertAnalysisToLLMInput
- src/services/llmService/estilos/marketing/index.ts
  - exports: MARKETING_SYSTEM_INFO
- src/services/llmService/estilos/marketing/index_clean.ts
- src/services/llmService/estilos/marketing/orchestrator.ts
  - exports: MarketingOrchestrator, marketingOrchestrator
- src/services/llmService/estilos/marketing/persuasionEngine.ts
- src/services/llmService/estilos/marketing/pipelineConnection.ts
- src/services/llmService/estilos/marketing/pipelineEnhancer.ts
- src/services/llmService/estilos/marketing/psychologicalHooks.ts
- src/services/llmService/estilos/marketing/quickIntegration.ts

### src/services/llmService/estilos/narrativa

- src/services/llmService/estilos/narrativa/orquestador.ts
  - exports: orquestarEquipoNarrativa

### src/services/llmService/estilos/noticias

- src/services/llmService/estilos/noticias/orquestador.ts
  - exports: orquestarEquipoNoticias

### src/services/llmService/helpers

- src/services/llmService/helpers/assetUtils.ts
  - exports: filtrarFondos, filtrarActores, getEstilosCompatibles, seleccionarAssetPorIndice, cargarAssetsIndex, buscarAssetPorNombre
- src/services/llmService/helpers/segmentador.ts
  - exports: segmentarPorEstilo

### src/services/llmService/prompts

- src/services/llmService/prompts/promptUtils.ts
  - exports: cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS

### src/services/videoGeneration

- src/services/videoGeneration/engineSelector.ts
  - exports: selectOptimalEngine, ENGINE_USE_CASES, trackEnginePerformance
- src/services/videoGeneration/klingCommercial.ts
  - exports: buildKlingCommercialPrompt, KLING_BUSINESS_TEMPLATES, submitKlingRequest, checkKlingStatus, waitForKlingCompletion, createAdvancedKlingRequest
- src/services/videoGeneration/runwayCommercial.ts
  - exports: buildRunwayCommercialPrompt, RUNWAY_BUSINESS_TEMPLATES, createAdvancedRunwayRequest, submitRunwayRequest, checkRunwayStatus, waitForRunwayCompletion

### src/types

- src/types/AudioTypes.ts
- src/types/VideoSegment.ts
- src/types/estilos.ts
  - exports: MAPEO_ESTILOS, normalizarEstilo, esEstiloValido, ESTILOS_VALIDOS, CONFIGURACION_ESTILOS
- src/types/marketing.ts
- src/types/respuestas.ts

### src/utils

- src/utils/asyncHandler.ts
  - exports: asyncHandler
- src/utils/audioUtils.ts
- src/utils/cinemaLogger.ts
- src/utils/coherenciaVideoDialogo.ts
  - exports: mejorarCoherenciaDialogo, mejorarCoherenciaVisual, mapearVocesExistentes, validarCoherenciaPlan
- src/utils/errorHandler.ts
- src/utils/errors.ts
  - exports: AppError, ValidationError, UnauthorizedError, NotFoundError, ConflictError, RateLimitError, ExternalServiceError, isOperationalError
- src/utils/logger.ts
  - exports: logger, truncateForLog, safeLog, hasLargeBase64
- src/utils/menteFondos.ts
  - exports: AssetIndexSchema, sugerirFondoActorLLM, cargarAssetsIndex, corregirFondosActoresInvalidos, validarVideoPlanFondosActores
- src/utils/normalizeSceneFields.ts
- src/utils/paths.ts
  - exports: toPosix
- src/utils/retry.ts
  - exports: retry
- src/utils/searchAsset.ts
- src/utils/types-new.ts
- src/utils/types.ts
- src/utils/validadores.ts
  - exports: validarDuracionEstricta, normalizarDuracion, validarEstiloVisual, normalizarEstiloVisual, validarCarryoverLevel, normalizarCarryoverLevel, validarEstructuraMetricas, validarRenderRequest, logValidacion
- src/utils/validateVideoPlan.ts
- src/utils/videoUtils.ts
  - exports: getVideoInfo, verificarDuracionVideo, calcularDuracionEsperadaDesdePlan
- src/utils/videoValidator.ts
  - exports: VideoValidator

## Prisma models

- User: id:Int, email:String, password:String, name:String, role:Role, plan:Plan, isActive:Boolean, emailVerified:Boolean, emailVerificationToken:String?, resetPasswordToken:String?, resetPasswordExpires:DateTime?, lastLogin:DateTime?, createdAt:DateTime, updatedAt:DateTime, assets:Asset[], marketingConfig:MarketingConfig?, preferences:Preferences?, profile:Profile?, projects:Project[], refreshTokens:RefreshToken[], socialAccounts:SocialAccount[], subscription:Subscription?, usage:Usage?, businessMemory:UserBusinessMemory?, videos:Video[], marketingInsights:MarketingInsight[], contentOptimizations:ContentOptimization[], weeklyReports:WeeklyReport[]
- Subscription: id:Int, userId:Int, plan:Plan, status:SubscriptionStatus, currentPeriodStart:DateTime?, currentPeriodEnd:DateTime?, paypalSubscriptionId:String?, cancelAtPeriodEnd:Boolean, canceledAt:DateTime?, cancelReason:String?, createdAt:DateTime, updatedAt:DateTime, payments:Payment[], user:User
- Payment: id:Int, subscriptionId:Int, amount:Float, currency:String, status:PaymentStatus, paypalPaymentId:String?, paypalOrderId:String?, failureReason:String?, createdAt:DateTime, updatedAt:DateTime, subscription:Subscription
- Usage: id:Int, userId:Int, videosThisWeek:Int, weekResetDate:DateTime, storageUsedMB:Int, editorUsage:Int, agentGenerations:Int, lastEditorUse:DateTime?, lastAgentUse:DateTime?, lastVideoGenerated:DateTime?, createdAt:DateTime, updatedAt:DateTime, user:User
- Profile: id:Int, userId:Int, avatar:String?, company:String?, phone:String?, createdAt:DateTime, updatedAt:DateTime, user:User
- Preferences: id:Int, userId:Int, emailNotifications:Boolean, marketingEmails:Boolean, createdAt:DateTime, updatedAt:DateTime, user:User
- Video: id:Int, userId:Int, title:String, description:String?, type:VideoType, status:VideoStatus, finalVideoUrl:String?, thumbnailUrl:String?, duration:Float?, prompt:String?, style:String?, businessType:String?, metadata:Json?, createdAt:DateTime, updatedAt:DateTime, socialPosts:SocialPost[], user:User
- MarketingConfig: id:Int, userId:Int, businessType:String?, style:String?, voiceType:String?, musicStyle:String?, frequency:String?, tone:String?, colors:String?, createdAt:DateTime, updatedAt:DateTime, user:User
- MarketingTemplate: id:Int, title:String, description:String?, businessType:String, category:String, structure:Json, duration:Int, style:String, tone:String, musicStyle:String?, voiceType:String, effectsEnabled:Boolean, isActive:Boolean, isPublic:Boolean, useCount:Int, tags:String?, thumbnail:String?, sampleVideo:String?, createdAt:DateTime, updatedAt:DateTime
- Project: id:Int, userId:Int, title:String, description:String?, status:ProjectStatus, data:Json?, createdAt:DateTime, updatedAt:DateTime, user:User
- Asset: id:Int, userId:Int, filename:String, url:String, type:AssetType, size:Int, createdAt:DateTime, updatedAt:DateTime, user:User
- RefreshToken: id:Int, userId:Int, token:String, expiresAt:DateTime, revokedAt:DateTime?, createdAt:DateTime, user:User
- SocialAccount: id:Int, userId:Int, platform:SocialPlatform, username:String, platformUserId:String?, accessToken:String?, refreshToken:String?, tokenExpiry:DateTime?, isActive:Boolean, autoPublish:Boolean, settings:Json?, createdAt:DateTime, updatedAt:DateTime, user:User, posts:SocialPost[], instagramMetrics:InstagramMetrics[], postAnalytics:PostAnalytics[]
- SocialPost: id:Int, socialAccountId:Int, videoId:Int?, title:String?, caption:String?, hashtags:String?, status:PostStatus, scheduledFor:DateTime?, publishedAt:DateTime?, platformPostId:String?, errorMessage:String?, createdAt:DateTime, updatedAt:DateTime, socialAccount:SocialAccount, video:Video?
- UserBusinessMemory: id:String, userId:Int, businessType:String?, businessName:String?, industry:String?, targetAudience:Json?, brandVoice:String?, competitors:Json?, valueProposition:String?, videosCreated:Json?, successfulCopy:Json?, platformMetrics:Json?, engagementData:Json?, preferredStyles:Json?, optimalTimes:Json?, budgetInfo:Json?, painPoints:Json?, favoriteEngines:Json?, lastInteraction:DateTime, createdAt:DateTime, updatedAt:DateTime, conversations:ConversationMemory[], user:User
- ConversationMemory: id:String, businessMemoryId:String, userMessage:String, agentResponse:String, context:String, outcome:String, followUpNeeded:Boolean, actionsTaken:Json?, confidence:Float?, needsMoreInfo:Boolean, timestamp:DateTime, businessMemory:UserBusinessMemory
- InstagramMetrics: id:Int, accountId:Int, date:DateTime, reach:Int?, impressions:Int?, followers:Int?, profileViews:Int?, websiteClicks:Int?, account:SocialAccount, createdAt:DateTime, updatedAt:DateTime
- PostAnalytics: id:Int, postId:String, accountId:Int, caption:String?, permalink:String?, thumbnail:String?, likes:Int?, comments:Int?, saves:Int?, reach:Int?, impressions:Int?, postedAt:DateTime, analyzedAt:DateTime, account:SocialAccount
- MarketingInsight: id:Int, userId:Int, title:String, content:String, priority:Int, actionable:Boolean, isRead:Boolean, isArchived:Boolean, expiresAt:DateTime?, createdAt:DateTime, user:User
- ContentOptimization: id:Int, userId:Int, originalPostId:String?, originalContent:String, optimizedContent:String, status:String, scheduledFor:DateTime?, createdAt:DateTime, user:User
- WeeklyReport: id:Int, userId:Int, weekStart:DateTime, weekEnd:DateTime, generated:Boolean, createdAt:DateTime, user:User

## Guía rápida para entender este backend

### Qué estás construyendo

Una plataforma de video marketing con un agente conversacional y analítica de Instagram integrada. El backend expone APIs para:

- Autenticación y perfiles, gestión de planes y suscripciones (PayPal).
- Agente de marketing con memoria de negocio y acciones sugeridas.
- Analítica y optimización de contenido para Instagram (métricas de cuenta y de posts).
- Plantillas y orquestadores LLM para generar guiones, assets y videos.
- Render de videos y publicación social (posts programados y seguimiento).

### Arquitectura en 1 minuto

- Express + rutas en `src/routes`, controladores en `src/controllers` y servicios en `src/services`.
- Persistencia con Prisma/PostgreSQL (ver modelos arriba).
- Pipelines de marketing y render en `src/pipelines` y `src/services/videoGeneration`.
- Integraciones: OpenRouter/LLM, voces (Murf/ElevenLabs), audio/música, Kling/Runway, SadTalker/Wav2Lip.

### Rutas: cómo leerlas rápido

Cada archivo de `src/routes` monta endpoints bajo el prefijo `/api`. Para ver qué hace cada ruta, mira las funciones exportadas por su controlador asociado (listadas en este inventario):

- `auth.ts` → `authController`: register, login, refreshToken, getProfile, updateProfile, requestPasswordReset, resetPassword, verifyEmail, logout.
- `subscriptionRoutes.ts` → `subscriptionController`: createSubscription, getUserActiveSubscription, getUserSubscriptions, getSubscription, cancelSubscription, getUserPlanLimits, checkFeatureAccess, getSubscriptionApprovalUrl.
- `marketingAgentRoutes.ts` → `marketingAgentController`: chatWithAgent, getWelcomeMessage, getConversationHistory, getBusinessContext, updateConversationFeedback, executeSuggestedAction, crearCampa.
- `social.ts` → servicios de social/instagram: métricas de cuenta (`InstagramMetrics`) y de post (`PostAnalytics`), scorecards, briefs, horarios óptimos, optimización de copy y sincronización.
- `marketingRoutes.ts` y `marketingTemplateRoutes.ts` → `MarketingController`/`MarketingTemplateController` y `MARKETING_TEMPLATES`.
- `render.ts` → `renderRouter` para render y pipelines de video.
- `admin.ts`, `cleanup.ts`, `testingRoutes.ts`, `webhookRoutes.ts`, `editor*.ts`, `cinemaRoutes.ts` → utilidades, mantenimiento y pruebas.

Nota: Los nombres exactos de los paths pueden variar según cómo se monten en `src/index.ts`, pero el prefijo común es `/api`.

### Modelos Prisma clave para marketing/redes

- `SocialAccount` ⇄ `InstagramMetrics[]` y `PostAnalytics[]`.
- `MarketingInsight`, `ContentOptimization`, `WeeklyReport` ligados a `User`.
- Memoria del agente: `UserBusinessMemory` y `ConversationMemory`.

### Cómo regenerar este inventario

Se genera desde el código real con el script local. En Windows (cmd):

```
node scripts\generateDocs.cjs
```

El archivo resultante es este `AUTO_DOCS_BACKEND.md`.

### Próximos pasos sugeridos (operativos)

- Unificar el uso de cliente API en frontend para evitar rutas duplicadas (`/api/api`).
- Jobs/Cron para: sync de Instagram, reportes semanales y refresco de tokens de larga duración.
- Cobertura mínima de tests en servicios críticos (auth, suscripciones, agente, social).
- Observabilidad: logs estructurados y métricas básicas por servicio.

