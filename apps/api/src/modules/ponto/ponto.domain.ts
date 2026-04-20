import type { TipoPonto } from '@rb/constants';
import { SEQUENCIA_PONTO_OBRIGATORIA, PONTO_FOTO_MAX_BYTES } from '@rb/constants';

export function proximoTipoEsperado(tiposRegistrados: readonly TipoPonto[]): TipoPonto | null {
  for (const tipo of SEQUENCIA_PONTO_OBRIGATORIA) {
    if (!tiposRegistrados.includes(tipo)) {
      return tipo;
    }
  }
  return null;
}

export function estimarBytesDataUrl(dataUrl: string): number {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] ?? '' : dataUrl;
  return Math.floor(base64.length * 0.75);
}

export function fotoExcedeLimite(dataUrl: string): boolean {
  return estimarBytesDataUrl(dataUrl) > PONTO_FOTO_MAX_BYTES;
}

export function ehProximoValido(
  tiposRegistrados: readonly TipoPonto[],
  tipoDesejado: TipoPonto,
): boolean {
  return proximoTipoEsperado(tiposRegistrados) === tipoDesejado;
}

export function jornadaConcluida(tiposRegistrados: readonly TipoPonto[]): boolean {
  return SEQUENCIA_PONTO_OBRIGATORIA.every((t) => tiposRegistrados.includes(t));
}
