// ...existing code...
export function extractVideoUrl(obj: any): string | null {
  if (!obj) return null;
  // 1) string directo
  if (typeof obj === 'string' && obj.startsWith('http')) return obj;

  // 2) array de strings
  if (Array.isArray(obj)) {
    const s = obj.find((v: any) => typeof v === 'string' && v.startsWith('http'));
    if (s) return s;
    // array de objetos con .url
    for (const el of obj) {
      if (el && typeof el === 'object' && typeof el.url === 'string' && el.url.startsWith('http')) {
        return el.url;
      }
      const url = extractVideoUrl(el);
      if (url) return url;
    }
  }

  // 3) objeto con key `video`, `url`, `output`, `videos`…
  const keys = ['video', 'url', 'output', 'videos'];
  for (const k of keys) {
    if (typeof obj[k] === 'string' && obj[k].startsWith('http')) return obj[k];
    if (Array.isArray(obj[k])) {
      const s = obj[k].find((v: any) => typeof v === 'string' && v.startsWith('http'));
      if (s) return s;
      // vídeos anidados tipo { videos:[{url:"…"}] }
      if (obj[k][0]?.url) {
        const s2 = obj[k].map((v:any)=>v.url).find((u:string)=>u.startsWith('http'));
        if (s2) return s2;
      }
    }
    // output anidado tipo { output: { videos: [...] } }
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      const deep = extractVideoUrl(obj[k]);
      if (deep) return deep;
    }
  }

  // 4) nivel profundo recursivo
  for (const v of Object.values(obj)) {
    if (typeof v === 'object' && v !== null) {
      const deep = extractVideoUrl(v);
      if (deep) return deep;
    }
  }
  return null;
}
