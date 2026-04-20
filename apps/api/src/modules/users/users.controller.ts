import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Perfil, StatusUsuario } from '@prisma/client';
import type { AtualizarUsuarioInput, CriarUsuarioInput, ResetarSenhaInput } from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';

import type { UsersService } from './users.service.js';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  listar = async (
    req: FastifyRequest<{ Querystring: { perfil?: Perfil; status?: StatusUsuario; q?: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.listar({
      perfil: req.query.perfil,
      status: req.query.status,
      busca: req.query.q,
    });
    reply.send({ total: dados.length, dados });
  };

  obter = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dado = await this.service.obter(req.params.id);
    reply.send(dado);
  };

  criar = async (
    req: FastifyRequest<{ Body: CriarUsuarioInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const criado = await this.service.criar(req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.CRIAR_USUARIO,
      entidade: 'Usuario',
      entidadeId: criado.id,
      dadosNovos: { email: criado.email, matricula: criado.matricula, perfil: criado.perfil },
    });
    reply.code(201).send(criado);
  };

  atualizar = async (
    req: FastifyRequest<{ Params: { id: string }; Body: AtualizarUsuarioInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const anterior = await this.service.obter(req.params.id);
    const atualizado = await this.service.atualizar(req.params.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.EDITAR_USUARIO,
      entidade: 'Usuario',
      entidadeId: atualizado.id,
      dadosAnteriores: anterior,
      dadosNovos: atualizado,
    });
    reply.send(atualizado);
  };

  remover = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const inativado = await this.service.inativar(req.params.id);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.REMOVER_USUARIO,
      entidade: 'Usuario',
      entidadeId: inativado.id,
    });
    reply.send(inativado);
  };

  resetarSenha = async (
    req: FastifyRequest<{ Params: { id: string }; Body: ResetarSenhaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    await this.service.resetarSenha(req.params.id, req.body.novaSenha);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.REDEFINIR_SENHA,
      entidade: 'Usuario',
      entidadeId: req.params.id,
    });
    reply.send({ sucesso: true });
  };
}
