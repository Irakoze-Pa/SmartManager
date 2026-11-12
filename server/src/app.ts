import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRouter } from './routes/index.js';

export const createApp = (): express.Express => {
  const app = express();
  const configuredOrigins = new Set(env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()));
  const isLocalDevelopmentOrigin = (origin: string): boolean =>
    env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || configuredOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, 'This browser origin is not allowed'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

