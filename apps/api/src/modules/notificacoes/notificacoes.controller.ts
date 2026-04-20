import type { FastifyReply, FastifyRequest } from 'fastify';
import type { EnviarNotificacaoManualInput } from '@rb/validators';

import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import type { NotificacoesService } from './notificacoes.service.js';

export class NotificacoesController {
  constructor(private readonly service: NotificacoesService) {}

  minhas = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.doUsuario(req.user.id);
    reply.send({ total: dados.length, dados });
  };

  enviarManual = async (
    req: FastifyRequest<{ Body: EnviarNotificacaoManualInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    await this.service.enviarManual(req.body);
    reply.code(201).send({ sucesso: true });
  };

  processarFila = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const resultado = await this.service.processarFila();
    reply.send(resultado);
  };
}
