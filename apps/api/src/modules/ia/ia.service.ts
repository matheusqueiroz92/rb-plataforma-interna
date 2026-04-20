import { randomUUID } from 'node:crypto';
import type { EnviarMensagemIaInput } from '@rb/validators';

import { anthropicClient, type MensagemChat } from '../../integrations/anthropic/anthropic.client.js';
import { ErroValidacao } from '../../shared/errors/app-error.js';
import type { IIaRepository } from './ia.repository.js';

const LIMITE_HISTORICO = 20;

export class IaService {
  constructor(private readonly repo: IIaRepository) {}

  async enviar(usuarioId: string, input: EnviarMensagemIaInput) {
    if (!anthropicClient.configurado()) {
      throw new ErroValidacao('Chat com IA nao esta disponivel. Contate a gestora.');
    }

    const conversaId = input.conversaId ?? randomUUID();

    const historicoDb = await this.repo.historicoDaConversa(usuarioId, conversaId, LIMITE_HISTORICO);
    const historico: MensagemChat[] = historicoDb.map((m) => ({
      papel: m.papel,
      conteudo: m.conteudo,
    }));
    historico.push({ papel: 'USER', conteudo: input.mensagem });

    await this.repo.adicionarMensagem({
      usuarioId,
      conversaId,
      papel: 'USER',
      conteudo: input.mensagem,
    });

    const resposta = await anthropicClient.enviar(historico);

    await this.repo.adicionarMensagem({
      usuarioId,
      conversaId,
      papel: 'ASSISTANT',
      conteudo: resposta.texto,
      tokensConsumidos: resposta.tokensEntrada + resposta.tokensSaida,
      modeloClaude: resposta.modelo,
    });

    return {
      conversaId,
      resposta: resposta.texto,
      tokensEntrada: resposta.tokensEntrada,
      tokensSaida: resposta.tokensSaida,
      modelo: resposta.modelo,
    };
  }

  listarConversas(usuarioId: string, limite = 20) {
    return this.repo.listarConversas(usuarioId, limite);
  }

  historicoCompleto(usuarioId: string, conversaId: string) {
    return this.repo.historicoDaConversa(usuarioId, conversaId, 1000);
  }

  excluirConversa(usuarioId: string, conversaId: string) {
    return this.repo.excluirConversa(usuarioId, conversaId);
  }

  consumoDoMes(usuarioId: string) {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    return this.repo.consumoDoMes(usuarioId, inicio);
  }
}
