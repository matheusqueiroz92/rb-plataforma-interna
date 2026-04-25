import { prisma } from '../../shared/prisma/prisma.js';
import type { PerfilChecklist } from '@prisma/client';

export interface DadosBrutosSemana {
  usuarioId: string;
  nome: string;
  perfil: string;
  diasComEntradaPontual: number;
  notasDasDemandas: number[];
  demandasExtras: number;
  itensChecklistEsperados: number;
  itensChecklistConcluidos: number;
  relatoriosEnviados: number;
}

export interface IProdutividadeRepository {
  coletarDadosSemana(semana: string, dataInicio: Date, dataFim: Date): Promise<DadosBrutosSemana[]>;
  upsertPontuacao(dados: {
    usuarioId: string;
    semanaReferencia: string;
    pontualidadePontos: number;
    qualidadeDemandaMedia: number;
    demandasExtrasPontos: number;
    checklist5sPontos: number;
    relatoriosEntreguePontos: number;
    totalPontos: number;
  }): Promise<void>;
  atualizarRanking(semana: string): Promise<void>;
  ranking(semana: string): Promise<Array<{
    usuarioId: string;
    nome: string;
    perfil: string;
    pontualidadePontos: number;
    qualidadeDemandaMedia: number;
    demandasExtrasPontos: number;
    checklist5sPontos: number;
    relatoriosEntreguePontos: number;
    totalPontos: number;
    posicaoRanking: number | null;
  }>>;
  meuDesempenho(usuarioId: string, semanas: number): Promise<Array<{
    semanaReferencia: string;
    totalPontos: number;
    posicaoRanking: number | null;
  }>>;
}

export class PrismaProdutividadeRepository implements IProdutividadeRepository {
  async coletarDadosSemana(
    semana: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<DadosBrutosSemana[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { status: 'ATIVO', perfil: { in: ['ESTAGIARIO', 'ASSESSORA_JR'] } },
      select: { id: true, nome: true, perfil: true },
    });

    const resultado: DadosBrutosSemana[] = [];
    for (const u of usuarios) {
      const perfilChecklist: PerfilChecklist =
        u.perfil === 'ESTAGIARIO' || u.perfil === 'ASSESSORA_JR' ? u.perfil : 'TODOS';

      const [pontos, demandas, respostas, itensAplicaveis, relatorios] = await Promise.all([
        prisma.ponto.findMany({
          where: {
            usuarioId: u.id,
            tipo: 'ENTRADA',
            data: { gte: dataInicio, lte: dataFim },
          },
        }),
        prisma.demanda.findMany({
          where: {
            atribuidaAId: u.id,
            semanaReferencia: semana,
            notaCorrecao: { not: null },
          },
          select: { notaCorrecao: true },
        }),
        prisma.checklistResposta.findMany({
          where: {
            usuarioId: u.id,
            data: { gte: dataInicio, lte: dataFim },
          },
        }),
        prisma.checklistItem.count({
          where: { ativo: true, perfilAlvo: { in: ['TODOS', perfilChecklist] } },
        }),
        prisma.relatorioDiario.findMany({
          where: { usuarioId: u.id, data: { gte: dataInicio, lte: dataFim } },
        }),
      ]);

      const diasComEntradaPontual = pontos.length;
      const notasDasDemandas = demandas
        .map((d) => d.notaCorrecao)
        .filter((n): n is number => n !== null);
      const demandasExtras = demandas.length > 5 ? demandas.length - 5 : 0;
      const itensConcluidos = respostas.filter((r) => r.concluido).length;
      const diasUteis = 5;
      const itensEsperados = itensAplicaveis * diasUteis;

      resultado.push({
        usuarioId: u.id,
        nome: u.nome,
        perfil: u.perfil,
        diasComEntradaPontual,
        notasDasDemandas,
        demandasExtras,
        itensChecklistEsperados: itensEsperados,
        itensChecklistConcluidos: itensConcluidos,
        relatoriosEnviados: relatorios.length,
      });
    }
    return resultado;
  }

  async upsertPontuacao(dados: Parameters<IProdutividadeRepository['upsertPontuacao']>[0]): Promise<void> {
    await prisma.pontuacaoSemanal.upsert({
      where: {
        usuarioId_semanaReferencia: {
          usuarioId: dados.usuarioId,
          semanaReferencia: dados.semanaReferencia,
        },
      },
      update: {
        pontualidadePontos: dados.pontualidadePontos,
        qualidadeDemandaMedia: dados.qualidadeDemandaMedia,
        demandasExtrasPontos: dados.demandasExtrasPontos,
        checklist5sPontos: dados.checklist5sPontos,
        relatoriosEntreguePontos: dados.relatoriosEntreguePontos,
        totalPontos: dados.totalPontos,
        calculadoEm: new Date(),
      },
      create: {
        usuarioId: dados.usuarioId,
        semanaReferencia: dados.semanaReferencia,
        pontualidadePontos: dados.pontualidadePontos,
        qualidadeDemandaMedia: dados.qualidadeDemandaMedia,
        demandasExtrasPontos: dados.demandasExtrasPontos,
        checklist5sPontos: dados.checklist5sPontos,
        relatoriosEntreguePontos: dados.relatoriosEntreguePontos,
        totalPontos: dados.totalPontos,
      },
    });
  }

  async atualizarRanking(semana: string): Promise<void> {
    const pontuacoes = await prisma.pontuacaoSemanal.findMany({
      where: { semanaReferencia: semana },
      orderBy: { totalPontos: 'desc' },
    });
    await prisma.$transaction(
      pontuacoes.map((p, idx) =>
        prisma.pontuacaoSemanal.update({
          where: { id: p.id },
          data: { posicaoRanking: idx + 1 },
        }),
      ),
    );
  }

  async ranking(semana: string) {
    const pontuacoes = await prisma.pontuacaoSemanal.findMany({
      where: { semanaReferencia: semana },
      include: { usuario: { select: { id: true, nome: true, perfil: true } } },
      orderBy: [{ posicaoRanking: 'asc' }, { totalPontos: 'desc' }],
    });
    return pontuacoes.map((p) => ({
      usuarioId: p.usuarioId,
      nome: p.usuario.nome,
      perfil: p.usuario.perfil,
      pontualidadePontos: p.pontualidadePontos,
      qualidadeDemandaMedia: Number(p.qualidadeDemandaMedia),
      demandasExtrasPontos: p.demandasExtrasPontos,
      checklist5sPontos: p.checklist5sPontos,
      relatoriosEntreguePontos: p.relatoriosEntreguePontos,
      totalPontos: p.totalPontos,
      posicaoRanking: p.posicaoRanking,
    }));
  }

  async meuDesempenho(usuarioId: string, semanas: number) {
    const pontuacoes = await prisma.pontuacaoSemanal.findMany({
      where: { usuarioId },
      orderBy: { semanaReferencia: 'desc' },
      take: semanas,
    });
    return pontuacoes.map((p) => ({
      semanaReferencia: p.semanaReferencia,
      totalPontos: p.totalPontos,
      posicaoRanking: p.posicaoRanking,
    }));
  }
}
