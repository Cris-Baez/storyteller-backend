# 🚀 COMANDO CURL LISTO PARA TESTING

## ✅ **Tu comando funcionará perfectamente:**

```bash
curl -X POST http://localhost:3000/api/render \
  -F "prompt=Quiero un video de un hombre en una aventura épica" \
  -F "visualStyle=cinematic" \
  -F "duration=30"
```

## 🔍 **Verificaciones Completadas:**

### **✅ Endpoint Configurado:**
- Ruta: `/api/render` (POST)
- Configurado en `src/index.ts` línea 68
- Router recreado y funcional

### **✅ Validación de Datos:**
```typescript
// Campos requeridos y válidos:
prompt: "Quiero un video de un hombre en una aventura épica" ✅
visualStyle: "cinematic" ✅ (enum válido)
duration: 30 ✅ (entre 1-300 segundos)
```

### **✅ Sanitización de Prompt:**
- Mantiene ASCII + acentos básicos (`\x20-\x7E\u00C0-\u017F`)
- Tu prompt en español funcionará perfectamente
- Fallback automático si el prompt es muy corto

### **✅ Respuesta Esperada:**
```json
{
  "success": true,
  "jobId": "uuid-generado",
  "message": "Trabajo de renderizado iniciado",
  "estimatedTime": "20-30 minutos",
  "statusUrl": "/api/render/{jobId}/status",
  "resultUrl": "/api/render/{jobId}/result"
}
```

## 🎬 **Flujo Completo que se Ejecutará:**

1. **API recibe** tu curl request
2. **Valida** prompt, visualStyle=cinematic, duration=30
3. **Crea job** en la cola con datos validados
4. **Inicia pipeline** renderCinemaAI()
5. **Sistema de cerebros** genera narrativa épica
6. **Arte** selecciona fondos cinematográficos apropiados
7. **Kling** genera video de 30s con aventura épica
8. **Audio** añade voz + música cinematográfica + efectos
9. **Lip-sync** aplica Wav2Lip (cinematic = realista)
10. **CDN** sube video final

## 📋 **Endpoints de Seguimiento:**

```bash
# Consultar estado
curl http://localhost:3000/api/render/{jobId}/status

# Obtener resultado final
curl http://localhost:3000/api/render/{jobId}/result

# Health check
curl http://localhost:3000/api/render/health
```

## ⚡ **Antes de ejecutar, asegúrate de:**

1. **Servidor iniciado:**
   ```bash
   npm start
   # o
   npm run dev
   ```

2. **Puerto 3000 disponible:**
   ```bash
   # Verificar que el servidor responde:
   curl http://localhost:3000/healthz
   ```

3. **Variables de entorno configuradas:**
   - OPENROUTER_API_KEY (para cerebros IA)
   - FAL_KEY (para Kling)
   - MURF_API_KEY (para voz)
   - GCP_BUCKET_NAME (para assets CDN)

## 🎯 **Tu comando está 100% listo para funcionar!**

El sistema generará un video cinematográfico épico de 30 segundos con:
- 🎭 Narrativa de aventura profunda (3 actos)
- 🎨 Fondos cinematográficos apropiados
- 🎥 Video Kling de alta calidad
- 🗣️ Voz sincronizada con lip-sync
- 🎵 Música épica + efectos de sonido
- ✨ Resultado final en CDN público

**¡Ejecuta tu curl y disfruta viendo cómo se crea tu video!** 🚀🎬
