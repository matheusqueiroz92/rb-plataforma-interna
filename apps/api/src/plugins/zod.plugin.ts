import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

export const zodPlugin = fp(async (app: FastifyInstance) => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
}, { name: 'zod-plugin' });

export type AppInstance = FastifyInstance & { withTypeProvider: () => unknown };

export { type ZodTypeProvider };
