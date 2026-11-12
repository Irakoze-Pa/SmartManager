import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

let httpServer: Server | undefined;
let databaseRetryTimer: NodeJS.Timeout | undefined;
let shuttingDown = false;

const connectDatabaseWithRetry = async (): Promise<void> => {
  try {
    const target = await connectDatabase();
    console.log(`MongoDB connection established (${target})`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown connection error';
    console.error(`MongoDB unavailable: ${message}`);
    if (!shuttingDown) {
      console.log('Retrying MongoDB connection in 15 seconds');
      databaseRetryTimer = setTimeout(() => void connectDatabaseWithRetry(), 15_000);
    }
  }
};

const startServer = async (): Promise<void> => {
  const app = createApp();

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(env.PORT);
    server.once('listening', () => {
      httpServer = server;
      resolve();
    });
    server.once('error', reject);
  });
  console.log(`SmartShop Pro API is running on port ${env.PORT}`);
  void connectDatabaseWithRetry();
};

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received; shutting down gracefully`);
  shuttingDown = true;
  if (databaseRetryTimer) clearTimeout(databaseRetryTimer);

  if (httpServer?.listening) {
    await new Promise<void>((resolve, reject) => {
      httpServer?.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void startServer().catch((error: unknown) => {
  console.error('Failed to start SmartShop Pro API', error);
  process.exit(1);
});

