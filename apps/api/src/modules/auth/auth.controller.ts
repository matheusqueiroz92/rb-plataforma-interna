import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginInput, RefreshInput, TrocarSenhaInput } from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';

import { env } from '../../config/env.js';
import { extrairIp } from '../../shared/ip/ip.js';
import type { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (
    req: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const resposta = await this.service.autenticar(req.body, env.POP_EST_VERSAO_ATUAL);
      await req.server.registrarAuditoria({
        req,
        usuarioId: resposta.usuario.id,
        acao: ACAO_AUDITORIA.LOGIN,
        entidade: 'Usuario',
        entidadeId: resposta.usuario.id,
      });
      reply.send(resposta);
    } catch (erro) {
      if (req.body?.email) {
        await req.server.registrarAuditoria({
          req,
          acao: ACAO_AUDITORIA.LOGIN_FALHA,
          entidade: 'Usuario',
          dadosNovos: { emailTentativa: req.body.email },
        });
      }
      throw erro;
    }
  };

  refresh = async (
    req: FastifyRequest<{ Body: RefreshInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const tokens = this.service.renovarAcesso(req.body.refreshToken);
    reply.send(tokens);
  };

  logout = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (req.user) {
      await req.server.registrarAuditoria({
        req,
        acao: ACAO_AUDITORIA.LOGOUT,
        entidade: 'Usuario',
        entidadeId: req.user.id,
      });
    }
    reply.send({ sucesso: true });
  };

  trocarSenha = async (
    req: FastifyRequest<{ Body: TrocarSenhaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw req.server.httpErrors.unauthorized();
    await this.service.trocarSenha(req.user.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.REDEFINIR_SENHA,
      entidade: 'Usuario',
      entidadeId: req.user.id,
    });
    reply.send({ sucesso: true });
  };

  aceitarPop = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw req.server.httpErrors.unauthorized();
    await this.service.aceitarPop(req.user.id, env.POP_EST_VERSAO_ATUAL, extrairIp(req));
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.ACEITAR_POP,
      entidade: 'Usuario',
      entidadeId: req.user.id,
      dadosNovos: { versao: env.POP_EST_VERSAO_ATUAL },
    });
    reply.send({ sucesso: true, versao: env.POP_EST_VERSAO_ATUAL });
  };
}
