import { describe, it, expect } from 'vitest';
import { RegrasDelegacao, statusAposCorrecao } from './demandas.domain.js';

describe('RegrasDelegacao', () => {
  it('permite socio delegar para qualquer nivel inferior', () => {
    expect(RegrasDelegacao.validar('SOCIO', 'GESTORA').valida).toBe(true);
    expect(RegrasDelegacao.validar('SOCIO', 'ASSESSORA_JR').valida).toBe(true);
    expect(RegrasDelegacao.validar('SOCIO', 'ESTAGIARIO').valida).toBe(true);
  });

  it('permite gestora delegar para assessora junior e estagiario', () => {
    expect(RegrasDelegacao.validar('GESTORA', 'ASSESSORA_JR').valida).toBe(true);
    expect(RegrasDelegacao.validar('GESTORA', 'ESTAGIARIO').valida).toBe(true);
  });

  it('nega gestora delegar para socio', () => {
    const r = RegrasDelegacao.validar('GESTORA', 'SOCIO');
    expect(r.valida).toBe(false);
    expect(r.motivo).toContain('hierarquia');
  });

  it('permite assessora junior delegar somente para estagiario', () => {
    expect(RegrasDelegacao.validar('ASSESSORA_JR', 'ESTAGIARIO').valida).toBe(true);
    expect(RegrasDelegacao.validar('ASSESSORA_JR', 'GESTORA').valida).toBe(false);
  });

  it('estagiario nunca pode delegar', () => {
    expect(RegrasDelegacao.validar('ESTAGIARIO', 'ESTAGIARIO').valida).toBe(false);
  });

  it('estagiario nao pode criar demandas', () => {
    expect(RegrasDelegacao.podeCriarPara('ESTAGIARIO', 'ESTAGIARIO')).toBe(false);
  });

  it('estagiario nao pode corrigir', () => {
    expect(RegrasDelegacao.podeCorrigir('ESTAGIARIO')).toBe(false);
  });
});

describe('statusAposCorrecao', () => {
  it('nota 0 deixa em EM_CORRECAO', () => {
    expect(statusAposCorrecao(0)).toBe('EM_CORRECAO');
  });
  it('nota 8 e 10 finalizam como CONCLUIDA', () => {
    expect(statusAposCorrecao(8)).toBe('CONCLUIDA');
    expect(statusAposCorrecao(10)).toBe('CONCLUIDA');
  });
});
