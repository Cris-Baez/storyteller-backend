// src/utils/paths.ts
export function toPosix(p: string) {
  return p.replace(/\\/g, '/');
}
