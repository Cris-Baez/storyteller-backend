// Extrae el primer bloque JSON válido (objeto o array) de un string, aunque esté rodeado de texto, markdown, etc.
// Si returnParsed es true, devuelve el objeto ya parseado. Si no, devuelve el string JSON.
export function extractFirstJsonBlock(text: string, options?: { returnParsed?: boolean, debug?: boolean }): string | object | null {
  if (!text) return null;
  const trimmed = text.trim();
  const { returnParsed = false, debug = false } = options || {};

  // Helper para parsear y loguear si falla
  function tryParse(candidate: string): any {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.warn('[extractFirstJsonBlock] Falló parseo:', e, '\nTexto:', candidate);
      }
      return null;
    }
  }

  // Si es un JSON puro (objeto o array)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const parsed = tryParse(trimmed);
    if (parsed !== null) return returnParsed ? parsed : trimmed;
  }

  // Busca el primer bloque {...} o [...] que sea JSON válido, soporta anidados
  let stack = [];
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{' || char === '[') {
      if (stack.length === 0) start = i;
      stack.push(char);
    } else if (char === '}' || char === ']') {
      if (stack.length > 0) {
        const last = stack.pop();
        // Solo cierra si es el par correcto
        if ((last === '{' && char === '}') || (last === '[' && char === ']')) {
          if (stack.length === 0 && start !== -1) {
            const candidate = text.slice(start, i + 1);
            const parsed = tryParse(candidate);
            if (parsed !== null) return returnParsed ? parsed : candidate;
            // Si no es válido, sigue buscando
            start = -1;
          }
        } else {
          // Paréntesis desbalanceados, reiniciar stack
          stack = [];
          start = -1;
        }
      }
    }
  }
  // Fallback: regex simple por si el anidado no encuentra nada
  const blockRegex = /({[\s\S]*?})|(\[[\s\S]*?\])/g;
  let match;
  while ((match = blockRegex.exec(text))) {
    const candidate = match[1] || match[2];
    const parsed = tryParse(candidate);
    if (parsed !== null) return returnParsed ? parsed : candidate;
  }
  if (debug) {
    // eslint-disable-next-line no-console
    console.warn('[extractFirstJsonBlock] No se encontró ningún bloque JSON válido.');
  }
  return null;
}
