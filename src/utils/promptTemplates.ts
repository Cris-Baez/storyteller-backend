import fs from 'fs/promises';
import path from 'path';

export interface PromptTemplate {
  id: string;
  name: string;
  style: string;
  duration: number;
  emotion: string;
  recommendedLora: string;
  music: string;
  voiceStyle: string;
  model: string;
  fps: number;
  aspectRatio: string;
  timeline: Array<{
    second: number;
    action: string;
    camera: string;
    emotion: string;
    transition: string;
    sfx: string[];
  }>;
}

const TEMPLATES_PATH = path.join(process.cwd(), 'templates', 'promptTemplates.json');

export async function loadPromptTemplates(): Promise<PromptTemplate[]> {
  const raw = await fs.readFile(TEMPLATES_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function getTemplateById(id: string): Promise<PromptTemplate | undefined> {
  const templates = await loadPromptTemplates();
  return templates.find(t => t.id === id);
}

export async function listTemplates(style?: string): Promise<PromptTemplate[]> {
  const templates = await loadPromptTemplates();
  return style ? templates.filter(t => t.style === style) : templates;
}
