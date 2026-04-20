import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var __rbPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__rbPrisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__rbPrisma = prisma;
}

export type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
