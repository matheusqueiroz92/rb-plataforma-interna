import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AtualizarItemChecklistInput,
  CriarItemChecklistInput,
  ResponderChecklistInput,
} from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';

import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import type { ChecklistService } from './checklist.service.js';

export class ChecklistController {
  constructor(private readonly service: ChecklistService) {}

  listar = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dados = await this.service.listar(req.user?.perfil);
    reply.send({ total: dados.length, dados });
  };

  criar = async (
    req: FastifyRequest<{ Body: CriarItemChecklistInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const criado = await this.service.criar(req.body, req.user.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.CRIAR_CHECKLIST_ITEM,
      entidade: 'ChecklistItem',
      entidadeId: criado.id,
      dadosNovos: criado,
    });
    reply.code(201).send(criado);
  };

  atualizar = async (
    req: FastifyRequest<{ Params: { id: string }; Body: AtualizarItemChecklistInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const atualizado = await this.service.atualizar(req.params.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.ATUALIZAR_CHECKLIST_ITEM,
      entidade: 'ChecklistItem',
      entidadeId: atualizado.id,
      dadosNovos: atualizado,
    });
    reply.send(atualizado);
  };

  inativar = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const inativado = await this.service.inativar(req.params.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.INATIVAR_CHECKLIST_ITEM,
      entidade: 'ChecklistItem',
      entidadeId: inativado.id,
    });
    reply.send(inativado);
  };

  responder = async (
    req: FastifyRequest<{ Body: ResponderChecklistInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const resposta = await this.service.responder(req.user.id, req.body);
    reply.send(resposta);
  };

  progresso = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.progressoHoje(req.user.id, req.user.perfil);
    reply.send(dados);
  };

  equipe = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dados = await this.service.progressoEquipe();
    reply.send({ total: dados.length, dados });
  };
}
