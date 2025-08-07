// src/middleware/coherenciaAutomatic.d.ts
export interface CoherenciaAutomatica {
  mejorarPlanAutomaticamente(videoPlan: any, opciones?: any): Promise<any>;
  obtenerEstadisticas(): {
    videosProcessados: number;
    dialogosMejorados: number;
    promptsMejorados: number;
    vocesOptimizadas: number;
    cacheSize: number;
    timestamp: string;
  };
  limpiarCache(videoId?: string | null): void;
}

export declare const coherenciaAutomatica: CoherenciaAutomatica;
export declare class CoherenciaAutomatica {
  constructor();
}
