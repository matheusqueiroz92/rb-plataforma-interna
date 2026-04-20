import { logger } from '../shared/logger/logger.js';
import { novoNotificacoesService } from '../modules/notificacoes/notificacoes.routes.js';

export async function processarFilaWhatsapp(): Promise<void> {
  const servico = novoNotificacoesService();
  const resultado = await servico.processarFila(20);
  if (resultado.processadas > 0) {
    logger.info('Job fila WhatsApp processada', resultado);
  }
}
