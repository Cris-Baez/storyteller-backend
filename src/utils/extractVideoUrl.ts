export function extractVideoUrl(res: unknown): string | undefined {
  if (typeof res === 'string' && res.startsWith('http')) return res;

  if (Array.isArray(res)) {
    for (const el of res) {
      const url = extractVideoUrl(el);
      if (url) return url;
    }
    return;
  }

  if (res && typeof res === 'object') {
    const r = res as any;
    return (
      extractVideoUrl(r.video)   ||
      extractVideoUrl(r.output)  ||
      extractVideoUrl(r.url)
    );
  }
}
