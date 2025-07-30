import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'all.log'), level: 'info' })
  ]
});

// Utilidades para logging seguro con truncamiento de datos largos
export interface LogOptions {
  maxStringLength?: number;
  maxArrayItems?: number;
  maxObjectDepth?: number;
}

const defaultOptions: Required<LogOptions> = {
  maxStringLength: 500,
  maxArrayItems: 10,
  maxObjectDepth: 3
};

/**
 * Trunca datos largos para logging seguro
 */
export function truncateForLog(obj: any, options: LogOptions = {}, depth = 0): any {
  const opts = { ...defaultOptions, ...options };
  
  if (depth > opts.maxObjectDepth) {
    return '[Max depth reached]';
  }
  
  if (typeof obj === 'string') {
    return obj.length > opts.maxStringLength 
      ? obj.substring(0, opts.maxStringLength) + `...[truncated ${obj.length - opts.maxStringLength} chars]`
      : obj;
  }
  
  if (Array.isArray(obj)) {
    const truncatedArray = obj.slice(0, opts.maxArrayItems).map(item => 
      truncateForLog(item, options, depth + 1)
    );
    if (obj.length > opts.maxArrayItems) {
      truncatedArray.push(`...[${obj.length - opts.maxArrayItems} more items]`);
    }
    return truncatedArray;
  }
  
  if (obj && typeof obj === 'object') {
    const truncated: any = {};
    let processedKeys = 0;
    const maxKeys = 20;
    
    for (const [key, value] of Object.entries(obj)) {
      if (processedKeys >= maxKeys) {
        truncated[`...[${Object.keys(obj).length - maxKeys} more keys]`] = '...';
        break;
      }
      truncated[key] = truncateForLog(value, options, depth + 1);
      processedKeys++;
    }
    return truncated;
  }
  
  return obj;
}

/**
 * Console.log seguro que trunca datos largos
 */
export function safeLog(message: string, data?: any, options?: LogOptions) {
  if (data !== undefined) {
    console.log(message, truncateForLog(data, options));
  } else {
    console.log(message);
  }
}

/**
 * Detecta si un objeto contiene datos base64 largos
 */
export function hasLargeBase64(obj: any): boolean {
  if (typeof obj === 'string') {
    const base64Pattern = /^data:[^;]+;base64,|^[A-Za-z0-9+/]{100,}={0,2}$/;
    return obj.length > 1000 && base64Pattern.test(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.some(item => hasLargeBase64(item));
  }
  
  if (obj && typeof obj === 'object') {
    return Object.values(obj).some(value => hasLargeBase64(value));
  }
  
  return false;
}
