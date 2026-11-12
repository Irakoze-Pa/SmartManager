import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('bufferCommands', false);

export type DatabaseTarget = 'atlas';
let activeTarget: DatabaseTarget | null = null;

const connect = async (uri: string): Promise<void> => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
  });
};

export const connectDatabase = async (): Promise<DatabaseTarget> => {
  if (mongoose.connection.readyState === 1 && activeTarget) return activeTarget;

  await connect(env.MONGODB_URI);
  activeTarget = 'atlas';
  return activeTarget;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  activeTarget = null;
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
export const getDatabaseTarget = (): DatabaseTarget | null => activeTarget;

