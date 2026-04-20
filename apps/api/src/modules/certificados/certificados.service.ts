import path from 'node:path';
import fs from 'node:fs/promises';
import type { Certificado, TipoCertificado } from '@prisma/client';
import { formatarDataBR } from '@rb/utils';

import { prisma } from '../../shared/prisma/prisma.js';
import { logger } from '../../shared/logger/logger.js';
import { ErroConflito, ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import { renderizarPdf } from '../../integrations/pdf/pdf-generator.js';
import { renderizarCertificadoHtml } from '../../integrations/pdf/templates/certificado.template.js';
import type { ICertificadosRepository } from './certificados.repository.js';

export class CertificadosService {
  constructor(private readonly repo: ICertificadosRepository) {}

  async emitirSemanalPodium(
    semana: string,
    emitidoPorId?: string,
  ): Promise<Certificado[]> {
    const podium = await this.repo.podiumDaSemana(semana);
    const emitidos: Certificado[] = [];
    for (const p of podium) {
      const existe = await this.repo.jaExiste(p.usuarioId, 'SEMANAL', semana);
      if (existe) continue;

      const certificado = await this.emitirUnitario({
        usuarioId: p.usuarioId,
        nomeColaborador: p.nome,
        tipo: 'SEMANAL',
        periodoReferencia: semana,
        pontuacaoObtida: p.totalPontos,
        posicaoFinal: p.posicaoRanking,
        emitidoPorId,
      });
      emitidos.push(certificado);
    }
    return emitidos;
  }

  async emitirManual(params: {
    usuarioId: string;
    tipo: TipoCertificado;
    periodoReferencia: string;
    pontuacaoObtida: number;
    posicaoFinal: number;
    emitidoPorId: string;
  }): Promise<Certificado> {
    const existe = await this.repo.jaExiste(
      params.usuarioId,
      params.tipo,
      params.periodoReferencia,
    );
    if (existe) {
      throw new ErroConflito(
        `Certificado ${params.tipo} de ${params.periodoReferencia} ja foi emitido para este colaborador.`,
      );
    }
    const usuario = await prisma.usuario.findUnique({ where: { id: params.usuarioId } });
    if (!usuario) throw new ErroNaoEncontrado('Usuario');

    return this.emitirUnitario({
      usuarioId: usuario.id,
      nomeColaborador: usuario.nome,
      tipo: params.tipo,
      periodoReferencia: params.periodoReferencia,
      pontuacaoObtida: params.pontuacaoObtida,
      posicaoFinal: params.posicaoFinal,
      emitidoPorId: params.emitidoPorId,
    });
  }

  private async emitirUnitario(params: {
    usuarioId: string;
    nomeColaborador: string;
    tipo: TipoCertificado;
    periodoReferencia: string;
    pontuacaoObtida: number;
    posicaoFinal: number;
    emitidoPorId?: string;
  }): Promise<Certificado> {
    const numero = await this.repo.proximoNumero();

    const certificado = await this.repo.criar({
      usuarioId: params.usuarioId,
      tipo: params.tipo,
      periodoReferencia: params.periodoReferencia,
      pontuacaoObtida: params.pontuacaoObtida,
      posicaoFinal: params.posicaoFinal,
      emitidoPorId: params.emitidoPorId,
      numeroSequencial: numero,
    });

    try {
      const html = renderizarCertificadoHtml({
        nomeColaborador: params.nomeColaborador,
        tipoCertificado: params.tipo,
        periodoReferencia: params.periodoReferencia,
        pontuacaoObtida: params.pontuacaoObtida,
        posicaoFinal: params.posicaoFinal,
        numeroSequencial: numero,
        emitidoEm: formatarDataBR(new Date()),
      });

      const pdf = await renderizarPdf(html);
      const pasta = path.resolve(process.cwd(), 'uploads', 'certificados');
      await fs.mkdir(pasta, { recursive: true });
      const nomeArquivo = `${numero}.pdf`;
      await fs.writeFile(path.join(pasta, nomeArquivo), pdf);

      const pdfUrl = `/uploads/certificados/${nomeArquivo}`;
      await this.repo.atualizarPdfUrl(certificado.id, pdfUrl);
      return { ...certificado, pdfUrl };
    } catch (erro) {
      logger.error('Falha ao gerar PDF do certificado', { erro, certificadoId: certificado.id });
      return certificado;
    }
  }

  listarDoUsuario(usuarioId: string) {
    return this.repo.listarDoUsuario(usuarioId);
  }

  async buscarPdf(id: string): Promise<{ caminho: string; nomeArquivo: string }> {
    const c = await this.repo.buscarPorId(id);
    if (!c || !c.pdfUrl) throw new ErroNaoEncontrado('Certificado ou PDF');
    const nomeArquivo = `${c.numeroSequencial}.pdf`;
    const caminho = path.resolve(process.cwd(), 'uploads', 'certificados', nomeArquivo);
    return { caminho, nomeArquivo };
  }
}
