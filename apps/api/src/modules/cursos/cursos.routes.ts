import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  atualizarCursoSchema,
  concluirCursoSchema,
  criarCursoSchema,
  type AtualizarCursoInput,
  type ConcluirCursoInput,
  type CriarCursoInput,
} from '@rb/validators';

import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import { CursosService } from './cursos.service.js';
import { PrismaCursosRepository } from './cursos.repository.js';

export async function cursosRoutes(app: FastifyInstance): Promise<void> {
  const service = new CursosService(new PrismaCursosRepository());
  const route = app.withTypeProvider<ZodTypeProvider>();

  route.get('/', { onRequest: [app.autenticar] }, async (_req, reply: FastifyReply) => {
    const dados = await service.listar();
    reply.send({ total: dados.length, dados });
  });

  route.get(
    '/meu-progresso',
    { onRequest: [app.autenticar] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) throw new ErroAutenticacao();
      const dados = await service.progresso(req.user.id, req.user.perfil);
      reply.send({ total: dados.length, dados });
    },
  );

  route.post('/', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: criarCursoSchema },
    handler: async (req: FastifyRequest<{ Body: CriarCursoInput }>, reply) => {
      const c = await service.criar(req.body);
      reply.code(201).send(c);
    },
  });

  route.put('/:id', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: atualizarCursoSchema },
    handler: async (
      req: FastifyRequest<{ Params: { id: string }; Body: AtualizarCursoInput }>,
      reply,
    ) => {
      const c = await service.atualizar(req.params.id, req.body);
      reply.send(c);
    },
  });

  route.post('/concluir', {
    onRequest: [app.autenticar],
    schema: { body: concluirCursoSchema },
    handler: async (req: FastifyRequest<{ Body: ConcluirCursoInput }>, reply) => {
      if (!req.user) throw new ErroAutenticacao();
      const c = await service.marcarConcluido(req.user.id, req.body);
      reply.send(c);
    },
  });
}
