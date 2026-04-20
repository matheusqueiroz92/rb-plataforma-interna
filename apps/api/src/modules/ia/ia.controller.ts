import type { FastifyReply, FastifyRequest } from 'fastify';
import type { EnviarMensagemIaInput } from '@rb/validators';

import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import type { IaService } from './ia.service.js';

export class IaController {
  constructor(private readonly service: IaService) {}

  enviar = async (
    req: FastifyRequest<{ Body: EnviarMensagemIaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const resposta = await this.service.enviar(req.user.id, req.body);
    reply.send(resposta);
  };

  conversas = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.listarConversas(req.user.id);
    reply.send({ total: dados.length, dados });
  };

  historico = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.historicoCompleto(req.user.id, req.params.id);
    reply.send({ total: dados.length, dados });
  };

  excluir = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    await this.service.excluirConversa(req.user.id, req.params.id);
    reply.send({ sucesso: true });
  };

  consumo = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const tokens = await this.service.consumoDoMes(req.user.id);
    reply.send({ tokensNoMes: tokens });
  };
}
