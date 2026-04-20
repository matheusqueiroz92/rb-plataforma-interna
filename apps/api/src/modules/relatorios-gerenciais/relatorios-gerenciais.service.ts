import { formatarDataBR, formatarDataHoraBR, formatarHoraBR } from '@rb/utils';
import type { TipoPonto } from '@rb/constants';

import { prisma } from '../../shared/prisma/prisma.js';
import { ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import { renderizarPdf } from '../../integrations/pdf/pdf-generator.js';
import {
  renderizarEspelhoPontoHtml,
  type LinhaEspelhoPonto,
} from '../../integrations/pdf/templates/espelho-ponto.template.js';

function minutosEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.floor((fim.getTime() - inicio.getTime()) / 60_000));
}

function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class RelatoriosGerenciaisService {
  async espelhoPontoMensal(usuarioId: string, mes: number, ano: number): Promise<Buffer> {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new ErroNaoEncontrado('Usuario');

    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const pontos = await prisma.ponto.findMany({
      where: { usuarioId, data: { gte: inicio, lte: fim } },
      orderBy: [{ data: 'asc' }, { timestampServidor: 'asc' }],
    });

    const porDia = new Map<string, Record<TipoPonto, { ts: Date; editado: boolean } | null>>();
    for (const p of pontos) {
      const chave = p.data.toISOString().substring(0, 10);
      if (!porDia.has(chave)) {
        porDia.set(chave, {
          ENTRADA: null,
          SAIDA_ALMOCO: null,
          RETORNO_ALMOCO: null,
          SAIDA_FINAL: null,
        });
      }
      const dia = porDia.get(chave)!;
      dia[p.tipo] = { ts: p.timestampServidor, editado: p.editado };
    }

    const linhas: LinhaEspelhoPonto[] = [];
    let totalMinutos = 0;
    for (const [chave, dia] of Array.from(porDia.entries()).sort()) {
      let minutos = 0;
      if (dia.ENTRADA && dia.SAIDA_ALMOCO) {
        minutos += minutosEntre(dia.ENTRADA.ts, dia.SAIDA_ALMOCO.ts);
      }
      if (dia.RETORNO_ALMOCO && dia.SAIDA_FINAL) {
        minutos += minutosEntre(dia.RETORNO_ALMOCO.ts, dia.SAIDA_FINAL.ts);
      }
      totalMinutos += minutos;
      const editado =
        dia.ENTRADA?.editado ||
        dia.SAIDA_ALMOCO?.editado ||
        dia.RETORNO_ALMOCO?.editado ||
        dia.SAIDA_FINAL?.editado ||
        false;

      linhas.push({
        data: formatarDataBR(new Date(chave)),
        entrada: dia.ENTRADA ? formatarHoraBR(dia.ENTRADA.ts) : null,
        saidaAlmoco: dia.SAIDA_ALMOCO ? formatarHoraBR(dia.SAIDA_ALMOCO.ts) : null,
        retornoAlmoco: dia.RETORNO_ALMOCO ? formatarHoraBR(dia.RETORNO_ALMOCO.ts) : null,
        saidaFinal: dia.SAIDA_FINAL ? formatarHoraBR(dia.SAIDA_FINAL.ts) : null,
        horasTrabalhadas: formatarDuracao(minutos),
        editado,
      });
    }

    const mesExtenso = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bahia',
    }).format(inicio);

    const html = renderizarEspelhoPontoHtml({
      nomeColaborador: usuario.nome,
      matricula: usuario.matricula,
      perfil: usuario.perfil,
      mes: mesExtenso,
      linhas,
      totalHoras: formatarDuracao(totalMinutos),
      assinaturaEmitidoEm: formatarDataHoraBR(new Date()),
    });

    return renderizarPdf(html);
  }

  async resumoEquipe(de: Date, ate: Date) {
    const usuarios = await prisma.usuario.findMany({
      where: { status: 'ATIVO', perfil: { in: ['ESTAGIARIO', 'ASSESSORA_JR'] } },
      select: { id: true, nome: true, matricula: true, perfil: true },
    });

    const resultado = await Promise.all(
      usuarios.map(async (u) => {
        const [pontos, relatorios, demandas, respostasChecklist] = await Promise.all([
          prisma.ponto.count({
            where: { usuarioId: u.id, tipo: 'ENTRADA', data: { gte: de, lte: ate } },
          }),
          prisma.relatorioDiario.count({
            where: { usuarioId: u.id, data: { gte: de, lte: ate } },
          }),
          prisma.demanda.count({
            where: { atribuidaAId: u.id, criadoEm: { gte: de, lte: ate } },
          }),
          prisma.checklistResposta.count({
            where: { usuarioId: u.id, data: { gte: de, lte: ate }, concluido: true },
          }),
        ]);
        return {
          usuario: u,
          diasComEntrada: pontos,
          relatoriosEnviados: relatorios,
          demandasRecebidas: demandas,
          itensChecklistCumpridos: respostasChecklist,
        };
      }),
    );

    return resultado;
  }
}
