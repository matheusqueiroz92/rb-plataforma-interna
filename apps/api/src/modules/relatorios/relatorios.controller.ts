import type { FastifyReply, FastifyRequest } from 'fastify';
import type { EnviarRelatorioInput } from '@rb/validators';
import { ACAO_AUDITORIA, UPLOAD_MIMES_ATESTADO } from '@rb/constants';
import path from 'node:path';
import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

import { ErroAutenticacao, ErroValidacao } from '../../shared/errors/app-error.js';
import type { RelatoriosService } from './relatorios.service.js';

export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  enviar = async (
    req: FastifyRequest<{ Body: EnviarRelatorioInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const relatorio = await this.service.enviarDoDia(req.user.id, req.body);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.ENVIAR_RELATORIO,
      entidade: 'RelatorioDiario',
      entidadeId: relatorio.id,
      dadosNovos: {
        data: relatorio.data,
        demandaConcluida: relatorio.pergunta3DemandaConcluida,
      },
    });
    reply.code(201).send({ id: relatorio.id, enviadoEm: relatorio.enviadoEm });
  };

  meus = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.meus(req.user.id);
    reply.send({ total: dados.length, dados });
  };

  hoje = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dado = await this.service.doDia(req.user.id);
    reply.send(dado);
  };

  equipe = async (
    req: FastifyRequest<{ Querystring: { data?: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.equipe(req.query.data ? new Date(req.query.data) : undefined);
    reply.send({ total: dados.length, dados });
  };

  marcarLido = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dado = await this.service.marcarLido(req.params.id, req.user.id);
    reply.send(dado);
  };

  uploadAtestado = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const arquivo = await req.file();
    if (!arquivo) throw new ErroValidacao('Nenhum arquivo enviado.');
    if (!(UPLOAD_MIMES_ATESTADO as readonly string[]).includes(arquivo.mimetype)) {
      throw new ErroValidacao('Formato de arquivo nao permitido. Envie PDF, JPG ou PNG.');
    }

    const pastaUploads = path.resolve(process.cwd(), 'uploads', 'atestados');
    await fs.mkdir(pastaUploads, { recursive: true });
    const ext = path.extname(arquivo.filename).toLowerCase() || '.bin';
    const nomeArquivo = `${uuidv4()}${ext}`;
    const destino = path.join(pastaUploads, nomeArquivo);

    await pipeline(arquivo.file, createWriteStream(destino));

    reply.code(201).send({
      url: `/uploads/atestados/${nomeArquivo}`,
      nomeOriginal: arquivo.filename,
    });
  };
}
