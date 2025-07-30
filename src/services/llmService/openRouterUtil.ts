import { logFeedback } from '../feedbackService.js';

import axios from 'axios';
import { env } from '../../config/env.js';

export async function callOpenRouter(systemPrompt: string, userPrompt: string, model: string = 'openai/gpt-4o', timeoutMs: number = 300000): Promise<any> {
  if (typeof systemPrompt !== 'string' || !systemPrompt.trim()) {
    logFeedback({
      service: 'OpenRouter',
      action: 'LLM',
      success: false,
      error: 'Prompts inválidos',
      params: { systemPrompt, userPrompt, model }
    });
    throw new Error('Prompts inválidos para OpenRouter');
  }
  // Asegura que la URL termina en /chat/completions
  let apiUrl = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiUrl.endsWith('/chat/completions')) {
    apiUrl = apiUrl.replace(/\/?$/, '/chat/completions');
  }
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Falta OPENROUTER_API_KEY en el entorno');
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  // Headers requeridos por OpenRouter
  if (env.OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = env.OPENROUTER_HTTP_REFERER;
  if (env.OPENROUTER_X_TITLE) headers['X-Title'] = env.OPENROUTER_X_TITLE;

  const data = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 4096,
    temperature: 0.7
  };
  const effectiveTimeout = timeoutMs || 600000; // 10 minutos por defecto
  const start = Date.now();
  let response;
  try {
    response = await axios.post(apiUrl, data, { headers, timeout: effectiveTimeout });
    logFeedback({
      service: 'OpenRouter',
      action: 'LLM',
      timeoutMs: effectiveTimeout,
      elapsedMs: Date.now() - start,
      success: true
    });
  } catch (err: any) {
    if (err.response) {
      console.error('[OpenRouter] Error HTTP:', err.response.status, err.response.data);
      logFeedback({
        service: 'OpenRouter',
        action: 'LLM',
        timeoutMs: effectiveTimeout,
        elapsedMs: Date.now() - start,
        success: false,
        error: JSON.stringify(err.response.data)
      });
      throw new Error('OpenRouter API error: ' + JSON.stringify(err.response.data));
    } else {
      console.error('[OpenRouter] Error de red:', err.message);
      logFeedback({
        service: 'OpenRouter',
        action: 'LLM',
        timeoutMs: effectiveTimeout,
        elapsedMs: Date.now() - start,
        success: false,
        error: err.message
      });
      throw new Error('OpenRouter network error: ' + err.message);
    }
  }
  if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || typeof response.data.choices[0].message.content !== 'string') {
    console.error('[OpenRouter] Respuesta inesperada:', JSON.stringify(response.data));
    throw new Error('Respuesta inesperada de OpenRouter: ' + JSON.stringify(response.data));
  }
  let content = response.data.choices[0].message.content.trim();
  // Elimina bloque de código Markdown si existe
  if (content.startsWith('```json')) {
    content = content.replace(/^```json[\r\n]*/i, '').replace(/```\s*$/i, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/^```[\w]*[\r\n]*/i, '').replace(/```\s*$/i, '').trim();
  }
  return content;
}
