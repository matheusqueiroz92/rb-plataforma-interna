import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { atualizarUsuarioSchema, criarUsuarioSchema, resetarSenhaSchema } from '@rb/validators';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaUsersRepository } from './users.repository.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaUsersRepository();
  const service = new UsersService(repo);
  const controller = new UsersController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();
  const guard = [app.autenticar, app.exigirNivelMinimo('GESTORA')];

  route.get('/', { onRequest: guard, handler: controller.listar });
  route.post('/', {
    onRequest: guard,
    schema: { body: criarUsuarioSchema },
    handler: controller.criar,
  });
  route.get('/:id', { onRequest: guard, handler: controller.obter });
  route.put('/:id', {
    onRequest: guard,
    schema: { body: atualizarUsuarioSchema },
    handler: controller.atualizar,
  });
  route.delete('/:id', { onRequest: guard, handler: controller.remover });
  route.post('/:id/resetar-senha', {
    onRequest: guard,
    schema: { body: resetarSenhaSchema },
    handler: controller.resetarSenha,
  });
}
