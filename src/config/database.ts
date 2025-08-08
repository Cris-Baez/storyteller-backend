import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('[Database] Ya conectado a MongoDB');
    return;
  }

  try {
    const mongoUri = env.MONGODB_URI || 'mongodb://localhost:27017/storyteller';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    logger.info('[Database] ✅ Conectado a MongoDB');
    
  } catch (error) {
    logger.error('[Database] ❌ Error conectando a MongoDB:', error);
    // En desarrollo, continuar sin DB
    if (env.NODE_ENV !== 'development') {
      throw error;
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  logger.info('[Database] 🔌 Desconectado de MongoDB');
};
