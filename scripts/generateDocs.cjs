// Auto-doc generator for storyteller-backend
// Scans src and prisma to produce AUTO_DOCS_BACKEND.md with files, exports, endpoints, and models

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PRISMA = path.join(ROOT, 'prisma', 'schema.prisma');
const OUT = path.join(ROOT, 'AUTO_DOCS_BACKEND.md');

function walk(dir, exts = ['.ts', '.js']) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, exts));
    } else {
      if (exts.includes(path.extname(entry.name))) results.push(full);
    }
  }
  return results;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function readSafe(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function extractExports(code) {
  const exports = [];
  const re = /(export\s+async\s+function\s+([A-Za-z0-9_]+))|(export\s+function\s+([A-Za-z0-9_]+))|(export\s+class\s+([A-Za-z0-9_]+))|(export\s+const\s+([A-Za-z0-9_]+))/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[2] || m[4] || m[6] || m[8];
    if (name) exports.push(name);
  }
  return exports;
}

function extractRouterEndpoints(code) {
  const endpoints = [];
  const re = /router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    endpoints.push({ method: m[1].toUpperCase(), path: m[2] });
  }
  return endpoints;
}

function parsePrismaModels(schema) {
  const models = [];
  const lines = schema.split('\n');
  let current = null;
  for (const line of lines) {
    const start = line.match(/^model\s+([A-Za-z0-9_]+)\s+\{/);
    if (start) {
      if (current) models.push(current);
      current = { name: start[1], fields: [] };
      continue;
    }
    if (current) {
      if (line.trim().startsWith('}')) {
        models.push(current);
        current = null;
      } else {
        const f = line.trim().match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_\[\]?]+)(\s+@.+)?$/);
        if (f) current.fields.push({ name: f[1], type: f[2] });
      }
    }
  }
  return models;
}

function generate() {
  const files = walk(SRC, ['.ts', '.js']).sort();
  const byDir = new Map();

  for (const file of files) {
    const code = readSafe(file);
    const exports = extractExports(code);
    const endpoints = /\/routes\//.test(file) ? extractRouterEndpoints(code) : [];
    const dir = path.dirname(rel(file));
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push({ file: rel(file), exports, endpoints });
  }

  const prismaSchema = readSafe(PRISMA);
  const models = prismaSchema ? parsePrismaModels(prismaSchema) : [];

  let md = '# AUTO_DOCS_BACKEND (generado)\n\n\n';
  md += 'Inventario generado automáticamente de archivos, exports y endpoints. Fuente: carpeta src y prisma/schema.prisma.\n\n';

  md += '## Estructura src\n\n';
  for (const [dir, entries] of Array.from(byDir.entries()).sort()) {
    md += `### ${dir}\n\n`;
    for (const e of entries) {
      md += `- ${e.file}\n`;
      if (e.exports.length) md += `  - exports: ${e.exports.join(', ')}\n`;
      if (e.endpoints.length) {
        md += '  - endpoints:\n';
        for (const ep of e.endpoints) md += `    - [${ep.method}] ${ep.path}\n`;
      }
    }
    md += '\n';
  }

  md += '## Prisma models\n\n';
  for (const m of models) {
    md += `- ${m.name}: ${m.fields.map(f => `${f.name}:${f.type}`).join(', ')}\n`;
  }

  fs.writeFileSync(OUT, md, 'utf8');
  console.log('✅ Generated', rel(OUT));
}

generate();
