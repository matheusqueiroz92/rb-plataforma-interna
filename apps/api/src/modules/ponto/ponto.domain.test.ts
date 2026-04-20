import { describe, it, expect } from 'vitest';
import {
  proximoTipoEsperado,
  ehProximoValido,
  jornadaConcluida,
  fotoExcedeLimite,
} from './ponto.domain.js';

describe('ponto.domain', () => {
  describe('proximoTipoEsperado', () => {
    it('retorna ENTRADA quando nada foi registrado', () => {
      expect(proximoTipoEsperado([])).toBe('ENTRADA');
    });

    it('retorna SAIDA_ALMOCO apos ENTRADA', () => {
      expect(proximoTipoEsperado(['ENTRADA'])).toBe('SAIDA_ALMOCO');
    });

    it('retorna RETORNO_ALMOCO apos entrada e saida de almoco', () => {
      expect(proximoTipoEsperado(['ENTRADA', 'SAIDA_ALMOCO'])).toBe('RETORNO_ALMOCO');
    });

    it('retorna SAIDA_FINAL quando so falta ele', () => {
      expect(proximoTipoEsperado(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO'])).toBe('SAIDA_FINAL');
    });

    it('retorna null quando tudo registrado', () => {
      expect(
        proximoTipoEsperado(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL']),
      ).toBeNull();
    });
  });

  describe('ehProximoValido', () => {
    it('permite ENTRADA como primeiro registro', () => {
      expect(ehProximoValido([], 'ENTRADA')).toBe(true);
    });

    it('nega SAIDA_ALMOCO antes de ENTRADA', () => {
      expect(ehProximoValido([], 'SAIDA_ALMOCO')).toBe(false);
    });

    it('nega SAIDA_FINAL se ainda faltam intervalos', () => {
      expect(ehProximoValido(['ENTRADA'], 'SAIDA_FINAL')).toBe(false);
    });
  });

  describe('jornadaConcluida', () => {
    it('considera concluida quando tem todos os quatro pontos', () => {
      expect(
        jornadaConcluida(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL']),
      ).toBe(true);
    });

    it('considera incompleta com apenas tres', () => {
      expect(jornadaConcluida(['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO'])).toBe(false);
    });
  });

  describe('fotoExcedeLimite', () => {
    it('rejeita payload claramente gigantesco', () => {
      const dataUrl = `data:image/jpeg;base64,${'A'.repeat(500_000)}`;
      expect(fotoExcedeLimite(dataUrl)).toBe(true);
    });

    it('aceita payload pequeno', () => {
      const dataUrl = `data:image/jpeg;base64,${'A'.repeat(1000)}`;
      expect(fotoExcedeLimite(dataUrl)).toBe(false);
    });
  });
});
