import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CriarPopInput, AtualizarPopInput } from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';
import type { Perfil, StatusPopDocumento } from '@prisma/client';

import type { PopService } from './pop.service.js';

export class PopController {
  constructor(private readonly service: PopService) {}

  listar = async (
    req: FastifyRequest<{ Querystring: { perfil?: Perfil; status?: StatusPopDocumento } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.listar(req.query);
    reply.send({ total: dados.length, dados });
  };

  obter = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const dado = await this.service.obter(req.params.id);
    reply.send(dado);
  };

  criar = async (req: FastifyRequest<{ Body: CriarPopInput }>, reply: FastifyReply): Promise<void> => {
    const dado = await this.service.criar(req.body, req.user?.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.CRIAR_POP,
      entidade: 'PopDocumento',
      entidadeId: dado.id,
      dadosNovos: { perfil: dado.perfil, versao: dado.versao },
    });
    reply.status(201).send(dado);
  };

  atualizar = async (
    req: FastifyRequest<{ Params: { id: string }; Body: AtualizarPopInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dado = await this.service.atualizar(req.params.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.EDITAR_POP,
      entidade: 'PopDocumento',
      entidadeId: dado.id,
    });
    reply.send(dado);
  };

  aprovar = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw req.server.httpErrors.unauthorized();
    const dado = await this.service.aprovar(req.params.id, req.user.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.APROVAR_POP,
      entidade: 'PopDocumento',
      entidadeId: dado.id,
      dadosNovos: { versao: dado.versao, perfil: dado.perfil },
    });
    reply.send(dado);
  };

  publicar = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw req.server.httpErrors.unauthorized();
    const dado = await this.service.publicar(req.params.id, req.user.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.PUBLICAR_POP,
      entidade: 'PopDocumento',
      entidadeId: dado.id,
      dadosNovos: { versao: dado.versao, perfil: dado.perfil },
    });
    reply.send(dado);
  };

  vigentePorPerfil = async (
    req: FastifyRequest<{ Querystring: { perfil?: Perfil } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const perfil = req.query.perfil ?? req.user?.perfil;
    if (!perfil) throw req.server.httpErrors.badRequest('Perfil obrigatorio');
    const dado = await this.service.obterVigente(perfil);
    reply.send(dado);
  };
}
