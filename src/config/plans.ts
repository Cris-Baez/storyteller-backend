/**
 * 🎯 CONFIGURACIÓN DE PLANES - ALINEADO CON FLUJO.TXT
 * Precios y límites exactos según especificación
 */

import { $Enums } from '@prisma/client';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'MONTH';
  videosPerWeek: number;
  maxDuration: number; // segundos
  watermark: boolean;
  aiActor: boolean;
  editorPro: boolean;
  quality: 'standard' | 'hd' | '4k';
  features: string[];
}

/**
 * 📋 CONFIGURACIÓN EXACTA SEGÚN FLUJO.TXT
 * - STARTER: $0 (1 video/semana, con marca de agua)
 * - CREATOR: $29/mes (hasta 5 videos/semana, sin marca, actor IA)
 * - STUDIO PRO: $99/mes (sin límite práctico semanal, Editor Pro, export HD)
 */
export const PLAN_CONFIGS: Record<$Enums.Plan, PlanConfig> = {
  [$Enums.Plan.STARTER]: {
    id: $Enums.Plan.STARTER,
    name: 'Starter',
    price: 0,
    currency: 'USD',
    interval: 'MONTH',
    videosPerWeek: 1,
    maxDuration: 60,
    watermark: true,
    aiActor: false,
    editorPro: false,
    quality: 'standard',
    features: [
      'basic_generation',
      'standard_quality',
      'watermark'
    ]
  },
  
  [$Enums.Plan.CREATOR]: {
    id: $Enums.Plan.CREATOR,
    name: 'Creator',
    price: 29,
    currency: 'USD',
    interval: 'MONTH',
    videosPerWeek: 5,
    maxDuration: 60,
    watermark: false,
    aiActor: true,
    editorPro: false,
    quality: 'hd',
    features: [
      'basic_generation',
      'standard_quality',
      'hd_quality',
      'ai_actor',
      'no_watermark'
    ]
  },
  
  [$Enums.Plan.STUDIO_PRO]: {
    id: $Enums.Plan.STUDIO_PRO,
    name: 'Studio Pro',
    price: 99,
    currency: 'USD',
    interval: 'MONTH',
    videosPerWeek: Infinity,
    maxDuration: 60,
    watermark: false,
    aiActor: true,
    editorPro: true,
    quality: '4k',
    features: [
      'basic_generation',
      'standard_quality',
      'hd_quality',
      '4k_quality',
      'ai_actor',
      'no_watermark',
      'editor_pro',
      'unlimited_weekly'
    ]
  }
};

/**
 * 🎯 HELPER: Obtener configuración de plan
 */
export function getPlanConfig(planId: $Enums.Plan): PlanConfig {
  const config = PLAN_CONFIGS[planId];
  if (!config) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }
  return config;
}

/**
 * 🎯 HELPER: Verificar si el plan tiene una funcionalidad
 */
export function planHasFeature(planId: $Enums.Plan, feature: string): boolean {
  const config = getPlanConfig(planId);
  return config.features.includes(feature);
}

/**
 * 🎯 HELPER: Obtener límites de plan
 */
export function getPlanLimits(planId: $Enums.Plan) {
  const config = getPlanConfig(planId);
  return {
    videosPerWeek: config.videosPerWeek,
    maxDuration: config.maxDuration,
    watermark: config.watermark,
    aiActor: config.aiActor,
    editorPro: config.editorPro,
    quality: config.quality
  };
}
