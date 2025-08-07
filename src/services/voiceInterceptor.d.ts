// src/services/voiceInterceptor.d.ts
export interface VoiceInterceptor {
  generateVoiceConMejoras(solicitud: any, vozConfig?: any): Promise<any>;
  generarVocesParaTimeline(timeline: any[], opciones?: any): Promise<{
    resultados: any[];
    estadisticas: {
      total: number;
      exitosos: number;
      fallidos: number;
      mejorAsAplicadas: number;
    };
  }>;
  obtenerEstadisticas(): {
    mejorAsAplicadas: number;
    tipoServicio: string;
    timestamp: string;
  };
}

export declare const voiceInterceptor: VoiceInterceptor;
