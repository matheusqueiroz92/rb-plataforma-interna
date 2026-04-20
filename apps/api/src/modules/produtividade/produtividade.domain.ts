import { PONTOS_MAXIMOS_SEMANA } from '@rb/constants';

export interface DadosCalculoSemana {
  diasUteisDaSemana: number;
  diasComEntradaPontual: number;
  notasDasDemandas: number[];
  demandasExtras: number;
  itensChecklistEsperados: number;
  itensChecklistConcluidos: number;
  diasEsperadosRelatorio: number;
  relatoriosEnviados: number;
}

export interface ResultadoPontuacao {
  pontualidade: number;
  qualidadeMedia: number;
  qualidadePontos: number;
  extras: number;
  checklist: number;
  relatorios: number;
  total: number;
}

export function calcularPontuacaoSemana(d: DadosCalculoSemana): ResultadoPontuacao {
  const pontualidade =
    d.diasUteisDaSemana === 0
      ? 0
      : Math.round((d.diasComEntradaPontual / d.diasUteisDaSemana) * PONTOS_MAXIMOS_SEMANA.pontualidade);

  const qualidadeMedia =
    d.notasDasDemandas.length === 0
      ? 0
      : d.notasDasDemandas.reduce((acc, n) => acc + n, 0) / d.notasDasDemandas.length;
  const qualidadePontos = Math.round((qualidadeMedia / 10) * PONTOS_MAXIMOS_SEMANA.qualidade);

  const extras = Math.min(d.demandasExtras * 3, PONTOS_MAXIMOS_SEMANA.extras);

  const checklist =
    d.itensChecklistEsperados === 0
      ? 0
      : Math.round(
          (d.itensChecklistConcluidos / d.itensChecklistEsperados) * PONTOS_MAXIMOS_SEMANA.checklist,
        );

  const relatorios =
    d.diasEsperadosRelatorio === 0
      ? 0
      : Math.round((d.relatoriosEnviados / d.diasEsperadosRelatorio) * PONTOS_MAXIMOS_SEMANA.relatorios);

  const total = pontualidade + qualidadePontos + extras + checklist + relatorios;

  return {
    pontualidade,
    qualidadeMedia: Number(qualidadeMedia.toFixed(2)),
    qualidadePontos,
    extras,
    checklist,
    relatorios,
    total,
  };
}
