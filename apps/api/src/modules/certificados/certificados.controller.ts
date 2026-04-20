import type { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'node:fs/promises';
import { ACAO_AUDITORIA, type TipoCertificado } from '@rb/constants';

import { ErroAutenticacao, ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import type { CertificadosService } from './certificados.service.js';

interface EmitirManualBody {
  usuarioId: string;
  tipo: TipoCertificado;
  periodoReferencia: string;
  pontuacaoObtida: number;
  posicaoFinal: number;
}

export class CertificadosController {
  constructor(private readonly service: CertificadosService) {}

  meus = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.listarDoUsuario(req.user.id);
    reply.send({ total: dados.length, dados });
  };

  doUsuario = async (
    req: FastifyRequest<{ Params: { usuarioId: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.listarDoUsuario(req.params.usuarioId);
    reply.send({ total: dados.length, dados });
  };

  emitirSemanais = async (
    req: FastifyRequest<{ Body: { semana: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const emitidos = await this.service.emitirSemanalPodium(req.body.semana, req.user.id);
    for (const c of emitidos) {
      await req.server.registrarAuditoria({
        req,
        acao: ACAO_AUDITORIA.EMITIR_CERTIFICADO,
        entidade: 'Certificado',
        entidadeId: c.id,
        dadosNovos: { tipo: c.tipo, periodo: c.periodoReferencia },
      });
    }
    reply.code(201).send({ total: emitidos.length, dados: emitidos });
  };

  emitirManual = async (
    req: FastifyRequest<{ Body: EmitirManualBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const c = await this.service.emitirManual({ ...req.body, emitidoPorId: req.user.id });
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.EMITIR_CERTIFICADO,
      entidade: 'Certificado',
      entidadeId: c.id,
      dadosNovos: { tipo: c.tipo, periodo: c.periodoReferencia },
    });
    reply.code(201).send(c);
  };

  download = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { caminho, nomeArquivo } = await this.service.buscarPdf(req.params.id);
    try {
      const buffer = await fs.readFile(caminho);
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
        .send(buffer);
    } catch {
      throw new ErroNaoEncontrado('PDF');
    }
  };
}
