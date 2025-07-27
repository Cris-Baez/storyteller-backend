# Sistema de Cerebros Cinematográficos

## 🧠 Arquitectura Modular por Roles

El sistema LLMService ha sido completamente reestructurado en una arquitectura modular que simula un verdadero equipo de producción cinematográfica, donde cada "cerebro" se especializa en un aspecto específico de la creación audiovisual.

## 📁 Estructura del Proyecto

```
src/services/llmService/
├── dispatcher.ts                    # Coordinador principal
├── restricciones.ts                 # Reglas centralizadas por estilo
├── helpers/
│   ├── assetUtils.ts               # Utilidades para assets
│   └── segmentador.ts              # Segmentación temporal inteligente
└── estilos/
    └── cinematic/                  # Estilo cinematográfico (implementado)
        ├── director.ts             # Narrativa y estructura
        ├── arte.ts                 # Selección de fondos
        ├── actores.ts              # Casting y configuración vocal
        ├── fotografia.ts           # Configuración de cámara
        ├── sonido.ts               # Diseño de audio
        ├── editor.ts               # Configuración de edición
        └── orquestador.ts          # Coordinación del equipo
```

## 🎬 Cerebros Especializados

### 1. **Director** (`director.ts`)
- **Función**: Define la narrativa general y estructura emocional
- **Entrada**: Prompt del usuario
- **Salida**: Estructura narrativa en 3 actos con momentos emocionales
- **Especialización**: Aplica principios cinematográficos profesionales

### 2. **Director de Arte** (`arte.ts`)
- **Función**: Selecciona fondos basado en momento narrativo
- **Entrada**: Fondos disponibles, momento narrativo, contexto emocional
- **Salida**: Selección inteligente de escenarios
- **Especialización**: Considera época, ambiente y tono narrativo

### 3. **Director de Casting** (`actores.ts`)
- **Función**: Selección de actores y configuración vocal
- **Entrada**: Actores disponibles, momento emocional, narrativa
- **Salida**: Actor apropiado con configuración de voz
- **Especialización**: Casting por edad, emoción y personalidad

### 4. **Director de Fotografía** (`fotografia.ts`)
- **Función**: Configuración de cámara, shots, movimientos
- **Entrada**: Momento narrativo, emoción, tono
- **Salida**: Configuración completa de cámara
- **Especialización**: Shots cinematográficos profesionales

### 5. **Director de Sonido** (`sonido.ts`)
- **Función**: Diseño de audio, música, efectos, lip-sync
- **Entrada**: Momento narrativo, actor, configuración emocional
- **Salida**: Configuración completa de audio
- **Especialización**: Sincronización estratégica de lip-sync

### 6. **Editor** (`editor.ts`)
- **Función**: Configuración de edición, transiciones, ritmo
- **Entrada**: Timeline, momento narrativo, contexto
- **Salida**: Configuración de cortes y transiciones
- **Especialización**: Ritmo cinematográfico y continuidad

### 7. **Orquestador** (`orquestador.ts`)
- **Función**: Coordina todos los cerebros especializados
- **Entrada**: Prompt, duración, configuración
- **Salida**: VideoPlan completo segundo a segundo
- **Especialización**: Flujo de producción cinematográfica

## 🚀 Uso del Sistema

### Básico
```typescript
import { dispatchCerebros } from './dispatcher.js';

const resultado = await dispatchCerebros({
  prompt: "Un héroe camina por una ciudad post-apocalíptica",
  duracion: 15,
  estilo: 'cinematic'
});

console.log(resultado.videoPlan); // Timeline completo
```

### Integración con LLMService
```typescript
import { generarPlanCerebros } from './ejemplo-integracion.js';

const plan = await generarPlanCerebros(
  "Un padre abraza a su hija en el aeropuerto",
  12,
  'cinematic'
);
```

## 🎨 Estilos Implementados

### ✅ Cinematic
- **Características**: Narrativa en 3 actos, cinematografía profesional
- **Frame Rate**: 24 FPS (cinematográfico)
- **Color Grading**: LUT cinematográfico con film grain
- **Audio**: Música orquestal, efectos ambiente, lip-sync estratégico
- **Edición**: Transiciones fluidas, carryover inteligente

### 🚧 Próximamente
- **Anime**: Estilo de animación japonesa
- **Cartoon**: Estilo de animación occidental
- **Commercial**: Estilo publicitario profesional

## 🔧 Características Técnicas

### Segmentación Inteligente
- Divide automáticamente la duración en actos narrativos
- Adapta proporciones según el estilo visual
- Calcula momentos emocionales estratégicos

### Gestión de Assets
- Integración completa con `assets_index.json`
- Filtrado inteligente por tipo, época, ambiente
- Selección basada en contexto narrativo

### Sistema de Restricciones
- Reglas centralizadas por estilo visual
- Limitaciones técnicas y creativas
- Configuración de movimientos de cámara permitidos

### Fallbacks Robustos
- Sistema de emergencia para errores de LLM
- Plans de respaldo por estilo
- Validación completa de resultados

## 📊 Salida del Sistema

### VideoPlan Generado
```typescript
{
  timeline: [
    {
      segundo: 0,
      narrativa: { /* estructura narrativa */ },
      fondo: { archivo: "escenario_japon_frontal.jpg", tipo: "escenario" },
      actor: { archivo: "actor_joven.png", voz: "narrator-male" },
      camara: { shot: "wide", movement: "dolly-in", angle: "frontal" },
      sonido: { musica: "orchestral-intro", lipSync: "strategic" },
      edicion: { duracionEscena: 6, carryover: false, tipoCorte: "fade-in" },
      momentoNarrativo: "setup",
      esEmocional: false,
      tono: "misterioso"
    }
    // ... resto del timeline
  ],
  metadata: {
    duracionTotal: 15,
    actos: 3,
    momentosEmocionales: [5, 8, 12],
    estiloVisual: "cinematic"
  },
  configuracionGlobal: {
    aspectRatio: "16:9",
    frameRate: 24,
    resolucion: "1920x1080"
  }
}
```

## 🧪 Testing

```bash
# Compilar sistema completo
npx tsc --noEmit src/services/llmService/dispatcher.ts

# Ejecutar pruebas
npx tsx src/services/llmService/test-cerebros.ts

# Demostración de capacidades
npx tsx src/services/llmService/ejemplo-integracion.ts
```

## 🎯 Ventajas del Sistema

1. **Modularidad**: Cada cerebro es independiente y especializado
2. **Escalabilidad**: Fácil agregar nuevos estilos y roles
3. **Profesionalidad**: Aplica principios reales de producción audiovisual
4. **Robustez**: Sistemas de fallback y validación
5. **Mantenibilidad**: Código organizado por responsabilidades
6. **Extensibilidad**: Arquitectura preparada para crecimiento

## 🔮 Roadmap

- [ ] Implementar cerebros para estilo Anime
- [ ] Implementar cerebros para estilo Cartoon  
- [ ] Implementar cerebros para estilo Commercial
- [ ] Agregar cerebro de Post-Producción
- [ ] Sistema de A/B testing entre cerebros
- [ ] Métricas de calidad por cerebro
- [ ] Cache inteligente de decisiones

## 🎬 Filosofía

*"Cada video debe ser una pequeña obra cinematográfica, no solo una secuencia de imágenes. Los cerebros especializados trabajan juntos como un verdadero equipo de producción para crear experiencias audiovisuales coherentes y profesionales."*

---

**Arquitectura desarrollada como evolución del CinemaAI Backend para simular equipos de producción cinematográfica reales con IA especializada.**
