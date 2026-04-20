import Anthropic from '@anthropic-ai/sdk';

import { env } from '../../config/env.js';
import { logger } from '../../shared/logger/logger.js';
import { SYSTEM_PROMPT_AUXILIAR_JURIDICO } from './system-prompt.js';

export interface MensagemChat {
  papel: 'USER' | 'ASSISTANT';
  conteudo: string;
}

export interface RespostaClaude {
  texto: string;
  tokensEntrada: number;
  tokensSaida: number;
  modelo: string;
}

export class AnthropicClient {
  private readonly client: Anthropic | null;

  constructor() {
    if (env.ANTHROPIC_API_KEY === 'placeholder') {
      this.client = null;
      logger.warn('ANTHROPIC_API_KEY nao configurada. Chat IA desativado.');
    } else {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  configurado(): boolean {
    return this.client !== null;
  }

  async enviar(historico: MensagemChat[]): Promise<RespostaClaude> {
    if (!this.client) {
      throw new Error('Chat IA nao configurado. Contate a gestora.');
    }

    const messages = historico.map((m) => ({
      role: m.papel === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.conteudo,
    }));

    const resposta = await this.client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: env.ANTHROPIC_MAX_TOKENS,
      system: SYSTEM_PROMPT_AUXILIAR_JURIDICO,
      messages,
    });

    const textoBloco = resposta.content.find((c) => c.type === 'text');
    const texto = textoBloco && textoBloco.type === 'text' ? textoBloco.text : '';

    return {
      texto,
      tokensEntrada: resposta.usage.input_tokens,
      tokensSaida: resposta.usage.output_tokens,
      modelo: resposta.model,
    };
  }
}

export const anthropicClient = new AnthropicClient();
