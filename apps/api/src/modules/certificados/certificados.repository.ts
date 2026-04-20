import type { Certificado, TipoCertificado } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface ICertificadosRepository {
  proximoNumero(): Promise<string>;
  criar(dados: {
    usuarioId: string;
    tipo: TipoCertificado;
    periodoReferencia: string;
    pontuacaoObtida: number;
    posicaoFinal: number;
    emitidoPorId?: string;
    numeroSequencial: string;
    pdfUrl?: string;
  }): Promise<Certificado>;
  atualizarPdfUrl(id: string, pdfUrl: string): Promise<void>;
  buscarPorId(id: string): Promise<Certificado | null>;
  listarDoUsuario(usuarioId: string): Promise<Certificado[]>;
  jaExiste(usuarioId: string, tipo: TipoCertificado, periodo: string): Promise<boolean>;
  podiumDaSemana(semana: string): Promise<Array<{
    usuarioId: string;
    nome: string;
    perfil: string;
    totalPontos: number;
    posicaoRanking: number;
  }>>;
}

export class PrismaCertificadosRepository implements ICertificadosRepository {
  async proximoNumero(): Promise<string> {
    const ano = new Date().getFullYear();
    const count = await prisma.certificado.count({
      where: { numeroSequencial: { startsWith: `${ano}-` } },
    });
    return `${ano}-${String(count + 1).padStart(5, '0')}`;
  }

  async criar(dados: Parameters<ICertificadosRepository['criar']>[0]): Promise<Certificado> {
    return prisma.certificado.create({ data: dados });
  }

  async atualizarPdfUrl(id: string, pdfUrl: string): Promise<void> {
    await prisma.certificado.update({ where: { id }, data: { pdfUrl } });
  }

  async buscarPorId(id: string): Promise<Certificado | null> {
    return prisma.certificado.findUnique({ where: { id } });
  }

  async listarDoUsuario(usuarioId: string): Promise<Certificado[]> {
    return prisma.certificado.findMany({
      where: { usuarioId },
      orderBy: { emitidoEm: 'desc' },
    });
  }

  async jaExiste(usuarioId: string, tipo: TipoCertificado, periodo: string): Promise<boolean> {
    const c = await prisma.certificado.count({
      where: { usuarioId, tipo, periodoReferencia: periodo },
    });
    return c > 0;
  }

  async podiumDaSemana(semana: string) {
    const pontuacoes = await prisma.pontuacaoSemanal.findMany({
      where: { semanaReferencia: semana, posicaoRanking: { in: [1, 2, 3] } },
      include: { usuario: { select: { id: true, nome: true, perfil: true } } },
      orderBy: { posicaoRanking: 'asc' },
    });
    return pontuacoes.map((p) => ({
      usuarioId: p.usuarioId,
      nome: p.usuario.nome,
      perfil: p.usuario.perfil,
      totalPontos: p.totalPontos,
      posicaoRanking: p.posicaoRanking ?? 0,
    }));
  }
}
