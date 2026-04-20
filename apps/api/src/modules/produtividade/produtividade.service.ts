import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { calcularPontuacaoSemana } from './produtividade.domain.js';
import type { IProdutividadeRepository } from './produtividade.repository.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export class ProdutividadeService {
  constructor(private readonly repo: IProdutividadeRepository) {}

  private intervaloDaSemana(semana: string): { inicio: Date; fim: Date } {
    const [ano, semanaStr] = semana.split('-W');
    const numero = parseInt(semanaStr ?? '1', 10);
    const base = dayjs().tz('America/Bahia').isoWeekYear(parseInt(ano ?? '', 10) || dayjs().year());
    const dataSemana = base.isoWeek(numero);
    const inicio = dataSemana.startOf('isoWeek').toDate();
    const fim = dataSemana.endOf('isoWeek').toDate();
    return { inicio, fim };
  }

  async calcularRankingDaSemana(semana: string): Promise<void> {
    const { inicio, fim } = this.intervaloDaSemana(semana);
    const dados = await this.repo.coletarDadosSemana(semana, inicio, fim);

    for (const d of dados) {
      const resultado = calcularPontuacaoSemana({
        diasUteisDaSemana: 5,
        diasComEntradaPontual: Math.min(d.diasComEntradaPontual, 5),
        notasDasDemandas: d.notasDasDemandas,
        demandasExtras: d.demandasExtras,
        itensChecklistEsperados: d.itensChecklistEsperados,
        itensChecklistConcluidos: d.itensChecklistConcluidos,
        diasEsperadosRelatorio: 5,
        relatoriosEnviados: d.relatoriosEnviados,
      });

      await this.repo.upsertPontuacao({
        usuarioId: d.usuarioId,
        semanaReferencia: semana,
        pontualidadePontos: resultado.pontualidade,
        qualidadeDemandaMedia: resultado.qualidadeMedia,
        demandasExtrasPontos: resultado.extras,
        checklist5sPontos: resultado.checklist,
        relatoriosEntreguePontos: resultado.relatorios,
        totalPontos: resultado.total,
      });
    }

    await this.repo.atualizarRanking(semana);
  }

  ranking(semana: string) {
    return this.repo.ranking(semana);
  }

  meuDesempenho(usuarioId: string, semanas = 12) {
    return this.repo.meuDesempenho(usuarioId, semanas);
  }
}
