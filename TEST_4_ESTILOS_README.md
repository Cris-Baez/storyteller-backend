# Test de 4 Estilos CinemaAI - Validación Completa 🎬

Este script automatizado permite probar los 4 estilos principales de CinemaAI para validar que todos generen videos correctamente con audio integrado.

## 🎯 Estilos Incluidos

| Estilo | Duración | Tecnología Audio | Características |
|--------|----------|------------------|-----------------|
| 🎬 **CINEMATIC** | 30s | Wav2Lip | Cinematografía profesional, dramático |
| 🎌 **ANIME** | 25s | SadTalker | Estética anime, emociones exageradas |
| 🎨 **CARTOON** | 24s | SadTalker | Animación occidental, expresivo |
| 📺 **COMMERCIAL** | 30s | Sin lip-sync | Estilo comercial/publicitario |

## 🚀 Ejecución Rápida

### Windows:
```cmd
test_4_estilos.bat
```

### Manual (cualquier OS):
```bash
# 1. Compilar proyecto
npm run build

# 2. Iniciar servidor (en otra terminal)
npm run dev

# 3. Ejecutar test
node test_4_estilos_completo.js
```

## 📋 Prompts de Test

### 🎬 Cinematic
**Prompt:** "Un astronauta solitario camina por una estación espacial abandonada, los rayos de luz filtran por las ventanas creando un ambiente dramático y melancólico"
- **Validación:** Audio con Wav2Lip, cinematografía profesional

### 🎌 Anime  
**Prompt:** "Una guerrera anime con espada mágica se prepara para el combate final, sus ojos brillan con determinación mientras el viento mueve su cabello"
- **Validación:** Audio con SadTalker, estética anime

### 🎨 Cartoon
**Prompt:** "Un detective cartoon con sombrero investiga pistas en una oficina misteriosa, examina documentos con una lupa mientras reflexiona en voz alta"
- **Validación:** Audio con SadTalker, estilo animado

### 📺 Commercial
**Prompt:** "Un chef profesional presenta orgullosamente su nueva creación culinaria en una cocina moderna, destaca los ingredientes premium y la técnica perfecta"
- **Validación:** Audio sin lip-sync, estilo comercial

## 📊 Resultados

El test genera:

### 📁 Archivos de Resultado
- `./test_results_4_estilos/` - Directorio principal
- `resultado_[estilo]_[timestamp].json` - Datos detallados por estilo
- `reporte_completo_[timestamp].md` - Reporte ejecutivo

### 📝 Métricas Validadas
- ✅ **Generación exitosa** de video por estilo
- 🎵 **Integración de audio** según configuración
- 🎬 **Calidad visual** específica del estilo
- ⏱️ **Tiempos de ejecución** y rendimiento
- 🔍 **Validación de metadatos** y estructura

## 🛠️ Requisitos

### Dependencias del Sistema
- Node.js 16+ con módulos ES6
- Servidor CinemaAI corriendo en puerto 3000
- Acceso a internet para APIs externas

### Variables de Entorno
Asegúrate de tener configuradas:
```bash
OPENAI_API_KEY=tu_clave_openai
REPLICATE_API_TOKEN=tu_token_replicate
# ... otras claves según configuración
```

### Servicios Externos
- OpenRouter/OpenAI para generación de prompts
- Kling/Replicate para generación de video
- Google Cloud/CDN para assets

## ⏱️ Tiempo Estimado

| Estilo | Tiempo Aprox. | Factores |
|--------|---------------|----------|
| Cinematic | 8-12 min | Wav2Lip + calidad alta |
| Anime | 6-10 min | SadTalker + renderizado |
| Cartoon | 6-10 min | SadTalker + animación |
| Commercial | 5-8 min | Sin lip-sync |
| **TOTAL** | **25-40 min** | Depende de carga del servidor |

## 🔧 Troubleshooting

### Error: Servidor no disponible
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/healthz

# Iniciar servidor
npm run dev
```

### Error: Job timeout
- Aumentar `TIMEOUT_VIDEO` en el script
- Verificar carga del servidor
- Revisar logs: `./logs/all.log`

### Error: Validación fallida
- Verificar configuración de estilos
- Comprobar variables de entorno
- Revisar conectividad a APIs externas

## 📈 Interpretación de Resultados

### ✅ Test Exitoso
- Todos los estilos generan video + audio
- Metadatos correctos por estilo
- Tiempos dentro del rango esperado

### ⚠️ Test Parcial
- Algunos estilos funcionan, otros fallan
- Revisar logs específicos del estilo fallido
- Posible problema de configuración o API

### ❌ Test Fallido
- Ningún estilo genera correctamente
- Probable problema del servidor base
- Verificar dependencias y configuración

## 💡 Próximos Pasos

Después de ejecutar el test exitosamente:

1. **Optimización**: Identificar estilos más lentos
2. **A/B Testing**: Probar variaciones de prompts
3. **Scaling**: Configurar generación paralela
4. **Monitoring**: Implementar métricas en producción

---

*Generado para CinemaAI v1.0 - Sistema de generación de video con IA*
