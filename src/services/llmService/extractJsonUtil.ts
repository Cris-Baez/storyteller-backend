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
      if (debug && process?.env?.NODE_ENV === 'development') {
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

  // Busca el primer bloque {...} o [...] que sea JSON válido
  const blockRegex = /({[\s\S]*?})|(\[[\s\S]*?\])/g;
  let match;
  while ((match = blockRegex.exec(text))) {
    const candidate = match[1] || match[2];
    const parsed = tryParse(candidate);
    if (parsed !== null) return returnParsed ? parsed : candidate;
  }
  return null;
}
