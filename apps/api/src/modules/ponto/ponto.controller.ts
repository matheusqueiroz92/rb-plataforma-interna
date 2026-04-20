import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  EditarPontoInput,
  FiltroHistoricoInput,
  RegistrarPontoInput,
} from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';

import { extrairIp, extrairUserAgent } from '../../shared/ip/ip.js';
import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import type { PontoService } from './ponto.service.js';

export class PontoController {
  constructor(private readonly service: PontoService) {}

  registrar = async (
    req: FastifyRequest<{ Body: RegistrarPontoInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const ponto = await this.service.registrar(req.body, {
      usuarioId: req.user.id,
      ip: extrairIp(req),
      userAgent: extrairUserAgent(req),
    });
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.REGISTRAR_PONTO,
      entidade: 'Ponto',
      entidadeId: ponto.id,
      dadosNovos: {
        tipo: ponto.tipo,
        regime: ponto.regime,
        timestampServidor: ponto.timestampServidor,
      },
    });
    reply.code(201).send({
      id: ponto.id,
      tipo: ponto.tipo,
      regime: ponto.regime,
      timestampServidor: ponto.timestampServidor,
    });
  };

  hoje = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dado = await this.service.estadoHoje(req.user.id);
    reply.send(dado);
  };

  historico = async (
    req: FastifyRequest<{ Querystring: FiltroHistoricoInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.historico(req.user.id, req.query.de, req.query.ate);
    reply.send({ total: dados.length, dados });
  };

  editar = async (
    req: FastifyRequest<{ Params: { id: string }; Body: EditarPontoInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const editado = await this.service.editar(req.params.id, req.user.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.EDITAR_PONTO,
      entidade: 'Ponto',
      entidadeId: editado.id,
      dadosNovos: {
        tipo: editado.tipo,
        regime: editado.regime,
        timestampServidor: editado.timestampServidor,
        justificativa: editado.justificativaEdicao,
      },
    });
    reply.send({
      id: editado.id,
      tipo: editado.tipo,
      regime: editado.regime,
      timestampServidor: editado.timestampServidor,
      editado: true,
    });
  };
}
