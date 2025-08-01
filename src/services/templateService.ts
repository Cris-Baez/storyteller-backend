// src/services/templateService.ts - Servicio de Templates Predefinidos
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeLog } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Template {
  title: string;
  description: string;
  prompt: string;
  duracion: number;
  tono: string;
}

export interface TemplateCollection {
  [estilo: string]: {
    [categoria: string]: Template;
  };
}

let templatesCache: TemplateCollection | null = null;

/**
 * Cargar templates desde archivo JSON
 */
export function cargarTemplates(): TemplateCollection {
  if (templatesCache) {
    return templatesCache;
  }

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'templates.json');
    const templatesRaw = fs.readFileSync(templatePath, 'utf-8');
    templatesCache = JSON.parse(templatesRaw);
    
    safeLog('[TemplateService] Templates cargados exitosamente', {
      estilos: Object.keys(templatesCache || {}),
      totalTemplates: Object.values(templatesCache || {}).reduce((total, estilo) => total + Object.keys(estilo).length, 0)
    });
    
    return templatesCache!;
  } catch (error) {
    safeLog('[TemplateService] Error cargando templates:', error);
    return {};
  }
}

/**
 * Obtener template específico por estilo y categoría
 */
export function obtenerTemplate(estilo: string, categoria: string): Template | null {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    safeLog('[TemplateService] Estilo no encontrado:', estilo);
    return null;
  }
  
  if (!templates[estilo][categoria]) {
    safeLog('[TemplateService] Categoría no encontrada:', { estilo, categoria });
    return null;
  }
  
  return templates[estilo][categoria];
}

/**
 * Listar todas las categorías disponibles para un estilo
 */
export function listarCategoriasPorEstilo(estilo: string): string[] {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    return [];
  }
  
  return Object.keys(templates[estilo]);
}

/**
 * Listar todos los estilos disponibles
 */
export function listarEstilos(): string[] {
  const templates = cargarTemplates();
  return Object.keys(templates);
}

/**
 * Obtener todos los templates de un estilo
 */
export function obtenerTemplatesPorEstilo(estilo: string): { [categoria: string]: Template } | null {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    return null;
  }
  
  return templates[estilo];
}

/**
 * Buscar templates por texto en título o descripción
 */
export function buscarTemplates(termino: string): Array<{
  estilo: string;
  categoria: string;
  template: Template;
}> {
  const templates = cargarTemplates();
  const resultados: Array<{
    estilo: string;
    categoria: string;
    template: Template;
  }> = [];
  
  const terminoLower = termino.toLowerCase();
  
  Object.entries(templates).forEach(([estilo, categorias]) => {
    Object.entries(categorias).forEach(([categoria, template]) => {
      if (
        template.title.toLowerCase().includes(terminoLower) ||
        template.description.toLowerCase().includes(terminoLower) ||
        template.prompt.toLowerCase().includes(terminoLower)
      ) {
        resultados.push({ estilo, categoria, template });
      }
    });
  });
  
  return resultados;
}

/**
 * Validar que un template tiene todos los campos requeridos
 */
export function validarTemplate(template: any): boolean {
  const camposRequeridos = ['title', 'description', 'prompt', 'duracion', 'tono'];
  
  return camposRequeridos.every(campo => {
    const existe = template.hasOwnProperty(campo);
    if (!existe) {
      safeLog('[TemplateService] Campo requerido faltante:', campo);
    }
    return existe;
  });
}

/**
 * Obtener template aleatorio de un estilo
 */
export function obtenerTemplateAleatorio(estilo?: string): {
  estilo: string;
  categoria: string;
  template: Template;
} | null {
  const templates = cargarTemplates();
  
  let estilosDisponibles = Object.keys(templates);
  if (estilo && templates[estilo]) {
    estilosDisponibles = [estilo];
  }
  
  if (estilosDisponibles.length === 0) {
    return null;
  }
  
  const estiloSeleccionado = estilosDisponibles[Math.floor(Math.random() * estilosDisponibles.length)];
  const categorias = Object.keys(templates[estiloSeleccionado]);
  
  if (categorias.length === 0) {
    return null;
  }
  
  const categoriaSeleccionada = categorias[Math.floor(Math.random() * categorias.length)];
  
  return {
    estilo: estiloSeleccionado,
    categoria: categoriaSeleccionada,
    template: templates[estiloSeleccionado][categoriaSeleccionada]
  };
}
