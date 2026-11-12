import type { RequestHandler } from 'express';
import { getDatabaseTarget, isDatabaseConnected } from '../../config/database.js';

export const getHealth: RequestHandler = (_request, response): void => {
  const databaseConnected = isDatabaseConnected();
  response.status(200).json({
    status: databaseConnected ? 'ok' : 'degraded',
    service: 'smartshop-pro-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: databaseConnected ? 'connected' : 'disconnected',
    databaseTarget: getDatabaseTarget(),
  });
};

