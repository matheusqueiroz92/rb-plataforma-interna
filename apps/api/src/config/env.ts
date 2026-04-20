import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  TZ: z.string().default('America/Bahia'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

  API_PORT: z.coerce.number().int().default(4000),
  UPLOAD_MAX_BYTES: z.coerce.number().int().default(5_242_880),

  ANTHROPIC_API_KEY: z.string().default('placeholder'),
  ANTHROPIC_MODEL: z.string().default('claude-opus-4-7'),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().int().default(4096),

  ZAPI_INSTANCE_ID: z.string().default('placeholder'),
  ZAPI_TOKEN: z.string().default('placeholder'),
  ZAPI_CLIENT_TOKEN: z.string().default('placeholder'),
  ZAPI_BASE_URL: z.string().default('https://api.z-api.io'),

  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().default(5),
  RATE_LIMIT_LOGIN_WINDOW_MIN: z.coerce.number().int().default(15),
  RATE_LIMIT_API_MAX: z.coerce.number().int().default(100),
  RATE_LIMIT_API_WINDOW_MIN: z.coerce.number().int().default(1),
  RATE_LIMIT_IA_MAX: z.coerce.number().int().default(30),
  RATE_LIMIT_IA_WINDOW_MIN: z.coerce.number().int().default(60),

  POP_EST_VERSAO_ATUAL: z.string().default('1.0'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variaveis de ambiente invalidas:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
