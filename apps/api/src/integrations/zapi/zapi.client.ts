import { env } from '../../config/env.js';
import { logger } from '../../shared/logger/logger.js';

export interface RespostaZapi {
  sucesso: boolean;
  zaapId?: string;
  messageId?: string;
  resposta?: unknown;
  erro?: string;
}

export class ZapiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${env.ZAPI_BASE_URL}/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}`;
  }

  private configurado(): boolean {
    return (
      env.ZAPI_INSTANCE_ID !== 'placeholder' &&
      env.ZAPI_TOKEN !== 'placeholder' &&
      env.ZAPI_CLIENT_TOKEN !== 'placeholder'
    );
  }

  async enviarTexto(telefone: string, mensagem: string): Promise<RespostaZapi> {
    if (!this.configurado()) {
      logger.warn('Z-API nao configurada. Ignorando envio.', { telefone });
      return { sucesso: false, erro: 'Z-API_NAO_CONFIGURADA' };
    }

    const numeroLimpo = telefone.replace(/\D/g, '');
    try {
      const resp = await fetch(`${this.baseUrl}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': env.ZAPI_CLIENT_TOKEN,
        },
        body: JSON.stringify({ phone: numeroLimpo, message: mensagem }),
      });
      const corpo = (await resp.json()) as Record<string, unknown>;
      if (!resp.ok) {
        logger.warn('Falha Z-API', { status: resp.status, corpo });
        return { sucesso: false, resposta: corpo, erro: `HTTP ${resp.status}` };
      }
      return {
        sucesso: true,
        zaapId: (corpo['zaapId'] as string) ?? undefined,
        messageId: (corpo['messageId'] as string) ?? undefined,
        resposta: corpo,
      };
    } catch (erro) {
      logger.error('Erro ao chamar Z-API', { erro });
      return { sucesso: false, erro: erro instanceof Error ? erro.message : 'erro desconhecido' };
    }
  }
}

export const zapiClient = new ZapiClient();
