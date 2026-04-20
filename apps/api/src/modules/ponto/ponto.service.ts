import type { EditarPontoInput, RegistrarPontoInput } from '@rb/validators';
import { dataHojeBahia } from '@rb/utils';
import { PONTO_FOTO_MAX_BYTES } from '@rb/constants';

import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../../shared/errors/app-error.js';
import {
  ehProximoValido,
  fotoExcedeLimite,
  jornadaConcluida,
  proximoTipoEsperado,
} from './ponto.domain.js';
import type { IPontoRepository } from './ponto.repository.js';

export interface ContextoRegistro {
  usuarioId: string;
  ip: string;
  userAgent: string;
}

export class PontoService {
  constructor(private readonly repo: IPontoRepository) {}

  async registrar(input: RegistrarPontoInput, ctx: ContextoRegistro) {
    if (fotoExcedeLimite(input.fotoBase64)) {
      throw new ErroValidacao(
        `A foto excede o tamanho maximo permitido (${Math.round(PONTO_FOTO_MAX_BYTES / 1024)}KB).`,
      );
    }

    const hoje = dataHojeBahia();
    const pontosHoje = await this.repo.pontosDoDia(ctx.usuarioId, hoje);

    if (pontosHoje.some((p) => p.tipo === input.tipo)) {
      throw new ErroConflito(`O registro de ${input.tipo} ja foi realizado hoje.`);
    }

    const tiposRegistrados = pontosHoje.map((p) => p.tipo);
    if (!ehProximoValido(tiposRegistrados, input.tipo)) {
      const esperado = proximoTipoEsperado(tiposRegistrados);
      throw new ErroValidacao(
        `Sequencia de ponto incorreta. Proximo registro esperado: ${esperado ?? 'nenhum'}.`,
      );
    }

    if (input.tipo === 'SAIDA_FINAL') {
      const temRelatorio = await this.repo.existeRelatorioDoDia(ctx.usuarioId, hoje);
      if (!temRelatorio) {
        throw new ErroValidacao(
          'Para registrar a saida final, envie antes o relatorio diario obrigatorio.',
        );
      }
    }

    return this.repo.criar({
      usuarioId: ctx.usuarioId,
      data: hoje,
      tipo: input.tipo,
      regime: input.regime,
      timestampServidor: new Date(),
      timestampCliente: input.timestampCliente ?? null,
      ipRegistro: ctx.ip,
      userAgent: ctx.userAgent,
      dispositivo: input.dispositivo ?? null,
      fotoBase64: input.fotoBase64,
      observacao: input.observacao ?? null,
    });
  }

  async estadoHoje(usuarioId: string) {
    const hoje = dataHojeBahia();
    const pontos = await this.repo.pontosDoDia(usuarioId, hoje);
    const tipos = pontos.map((p) => p.tipo);
    return {
      data: hoje.toISOString().substring(0, 10),
      pontos: pontos.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        regime: p.regime,
        timestampServidor: p.timestampServidor,
        editado: p.editado,
        observacao: p.observacao,
      })),
      proximoEsperado: proximoTipoEsperado(tipos),
      concluido: jornadaConcluida(tipos),
    };
  }

  historico(usuarioId: string, de?: Date, ate?: Date) {
    return this.repo.historico(usuarioId, de, ate);
  }

  async editar(pontoId: string, editorId: string, input: EditarPontoInput) {
    const anterior = await this.repo.buscarPorId(pontoId);
    if (!anterior) throw new ErroNaoEncontrado('Registro de ponto');
    return this.repo.editar(pontoId, editorId, {
      tipo: input.tipo,
      regime: input.regime,
      timestampServidor: input.timestampServidor,
      justificativaEdicao: input.justificativaEdicao,
    });
  }
}
