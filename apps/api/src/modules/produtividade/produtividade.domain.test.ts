import { describe, it, expect } from 'vitest';
import { calcularPontuacaoSemana } from './produtividade.domain.js';

describe('calcularPontuacaoSemana', () => {
  it('pontuacao maxima quando tudo impecavel', () => {
    const r = calcularPontuacaoSemana({
      diasUteisDaSemana: 5,
      diasComEntradaPontual: 5,
      notasDasDemandas: [10, 10, 10],
      demandasExtras: 5,
      itensChecklistEsperados: 100,
      itensChecklistConcluidos: 100,
      diasEsperadosRelatorio: 5,
      relatoriosEnviados: 5,
    });
    expect(r.pontualidade).toBe(25);
    expect(r.qualidadePontos).toBe(40);
    expect(r.extras).toBe(15);
    expect(r.checklist).toBe(10);
    expect(r.relatorios).toBe(10);
    expect(r.total).toBe(100);
  });

  it('penaliza quando ha notas baixas', () => {
    const r = calcularPontuacaoSemana({
      diasUteisDaSemana: 5,
      diasComEntradaPontual: 5,
      notasDasDemandas: [0, 8, 10],
      demandasExtras: 0,
      itensChecklistEsperados: 10,
      itensChecklistConcluidos: 10,
      diasEsperadosRelatorio: 5,
      relatoriosEnviados: 5,
    });
    expect(r.qualidadeMedia).toBeCloseTo(6);
    expect(r.qualidadePontos).toBe(24);
    expect(r.total).toBe(25 + 24 + 0 + 10 + 10);
  });

  it('retorna zero quando nao ha dados', () => {
    const r = calcularPontuacaoSemana({
      diasUteisDaSemana: 0,
      diasComEntradaPontual: 0,
      notasDasDemandas: [],
      demandasExtras: 0,
      itensChecklistEsperados: 0,
      itensChecklistConcluidos: 0,
      diasEsperadosRelatorio: 0,
      relatoriosEnviados: 0,
    });
    expect(r.total).toBe(0);
  });

  it('limita demandas extras a 15 pontos', () => {
    const r = calcularPontuacaoSemana({
      diasUteisDaSemana: 5,
      diasComEntradaPontual: 0,
      notasDasDemandas: [],
      demandasExtras: 20,
      itensChecklistEsperados: 0,
      itensChecklistConcluidos: 0,
      diasEsperadosRelatorio: 0,
      relatoriosEnviados: 0,
    });
    expect(r.extras).toBe(15);
  });
});
