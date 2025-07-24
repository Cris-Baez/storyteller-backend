# Pruebas automáticas

Para ejecutar los tests (unitarios/integración):

```sh
npm test
```

Asegúrate de tener tus tests en la carpeta `tests/` y de configurar el script `test` en `package.json` según tu framework preferido (por ejemplo, Jest, Mocha, etc).

Actualmente, el script de test muestra un mensaje por defecto. Puedes instalar Jest y configurarlo así:

```sh
npm install --save-dev jest @types/jest ts-jest
```

Y luego en `package.json`:

```json
"scripts": {
  ...existing scripts...
  "test": "jest"
}
```

Esto te permitirá correr `npm test` y ver los resultados de tus pruebas.
# Storyteller Backend

## Variables de entorno obligatorias

Debes definir las siguientes variables en tu archivo `.env` para un funcionamiento seguro y completo:

- `OPENAI_API_KEY`           # Clave de OpenAI
- `REPLICATE_API_TOKEN`      # Token de Replicate
- `MURF_API_KEY`             # Token de Murf (voz)
- `ELEVENLABS_API_KEY`       # Token de ElevenLabs (voz, opcional)
- `ARTLIST_TOKEN`            # Token de Artlist (música, opcional)
- `DM_API_TOKEN`             # Token de DreamMachine (opcional)
- `CDN_BUCKET_URL`           # URL del bucket CDN
- `OPENROUTER_API_KEY`       # Token de OpenRouter (LLM)
- `GCP_PROJECT_ID`           # ID de proyecto GCP
- `GCP_CREDENTIALS_JSON`     # Ruta a credenciales GCP
- `GCP_BUCKET_NAME`          # Nombre del bucket GCP
- `ADMIN_TOKEN`              # Token de admin para /admin/logs

Variables adicionales recomendadas:
- `GEN2_CONCURRENCY`, `GEN2_TIMEOUT_MS`, `FFMPEG_TIMEOUT_MS`, `OPENROUTER_BASE_URL`, `OPENROUTER_HTTP_REFERER`, `OPENROUTER_X_TITLE`, `FREESOUND_API_KEY`, `RUNWAYML_API_SECRET`, `RUNWAY_API_TOKEN`

## Seguridad
- Cambia siempre el valor de `ADMIN_TOKEN` en producción.
- No subas tu archivo `.env` a repositorios públicos.
- Limita el acceso a `/admin/logs` por firewall o red.

## Ejemplo de uso del endpoint de logs

```sh
curl -H "x-admin-token: TU_TOKEN" http://localhost:3000/admin/logs
```

---

Para más detalles, revisa los comentarios en el código fuente y la documentación interna de cada servicio.
