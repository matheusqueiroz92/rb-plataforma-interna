import type { EnviarRelatorioInput } from '@rb/validators';
import { dataHojeBahia } from '@rb/utils';

import { ErroConflito, ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import type { IRelatoriosRepository } from './relatorios.repository.js';

export class RelatoriosService {
  constructor(private readonly repo: IRelatoriosRepository) {}

  async enviarDoDia(usuarioId: string, input: EnviarRelatorioInput) {
    const hoje = dataHojeBahia();
    const existente = await this.repo.buscarDoDia(usuarioId, hoje);
    if (existente) throw new ErroConflito('Relatorio de hoje ja foi enviado.');

    return this.repo.criar({
      usuarioId,
      data: hoje,
      pergunta1Atividades: input.pergunta1Atividades,
      pergunta2Dificuldades: input.pergunta2Dificuldades,
      pergunta3DemandaConcluida: input.pergunta3DemandaConcluida,
      pergunta3Justificativa: input.pergunta3DemandaConcluida
        ? null
        : input.pergunta3Justificativa ?? null,
      atestadoAnexoUrl: input.atestadoAnexoUrl ?? null,
      atestadoTipo: input.atestadoTipo ?? null,
    });
  }

  meus(usuarioId: string, limite = 30) {
    return this.repo.listarDoUsuario(usuarioId, limite);
  }

  doDia(usuarioId: string) {
    return this.repo.buscarDoDia(usuarioId, dataHojeBahia());
  }

  equipe(data?: Date) {
    return this.repo.listarDoDia(data ?? dataHojeBahia());
  }

  async marcarLido(id: string, leitorId: string) {
    const existe = await this.repo.buscarPorId(id);
    if (!existe) throw new ErroNaoEncontrado('Relatorio');
    return this.repo.marcarComoLido(id, leitorId);
  }
}
