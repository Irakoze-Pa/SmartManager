import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173').refine(
    (value) => value.split(',').every((origin) => z.url().safeParse(origin.trim()).success),
    'CLIENT_ORIGIN must contain one or more comma-separated URLs',
  ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 30m, 8h, or 7d').default('8h'),
  PLATFORM_JWT_SECRET: z.string().min(32, 'PLATFORM_JWT_SECRET must contain at least 32 characters'),
  PLATFORM_JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('2h'),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsedEnvironment.data;

