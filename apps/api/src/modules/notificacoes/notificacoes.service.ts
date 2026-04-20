import type { EnviarNotificacaoManualInput } from '@rb/validators';
import { zapiClient } from '../../integrations/zapi/zapi.client.js';
import {
  renderizarTemplate,
  type ChaveTemplate,
  type TemplateContexto,
} from '../../integrations/zapi/templates.js';
import { prisma } from '../../shared/prisma/prisma.js';
import { logger } from '../../shared/logger/logger.js';
import { ErroValidacao } from '../../shared/errors/app-error.js';
import type { INotificacoesRepository } from './notificacoes.repository.js';

export class NotificacoesService {
  constructor(private readonly repo: INotificacoesRepository) {}

  async enfileirarTemplate(
    chaveTemplate: ChaveTemplate,
    tipo: Parameters<INotificacoesRepository['enfileirar']>[0]['tipo'],
    ctx: TemplateContexto & { usuarioId?: string; telefoneDestino?: string },
  ): Promise<void> {
    let telefone = ctx.telefoneDestino;
    if (!telefone && ctx.usuarioId) {
      const u = await prisma.usuario.findUnique({
        where: { id: ctx.usuarioId },
        select: { telefoneWhatsapp: true, nome: true },
      });
      if (u?.telefoneWhatsapp) {
        telefone = u.telefoneWhatsapp;
        if (!ctx.nome && u.nome) ctx.nome = u.nome;
      }
    }
    if (!telefone) {
      logger.warn('Notificacao sem destino telefonico', { chaveTemplate, usuarioId: ctx.usuarioId });
      return;
    }
    const mensagem = renderizarTemplate(chaveTemplate, ctx);
    await this.repo.enfileirar({
      usuarioId: ctx.usuarioId ?? null,
      telefoneDestino: telefone,
      tipo,
      mensagem,
    });
  }

  async enviarManual(input: EnviarNotificacaoManualInput): Promise<void> {
    let telefone = input.telefoneDestino;
    if (!telefone && input.usuarioId) {
      const u = await prisma.usuario.findUnique({
        where: { id: input.usuarioId },
        select: { telefoneWhatsapp: true },
      });
      telefone = u?.telefoneWhatsapp ?? undefined;
    }
    if (!telefone) throw new ErroValidacao('Usuario sem telefone cadastrado.');

    await this.repo.enfileirar({
      usuarioId: input.usuarioId ?? null,
      telefoneDestino: telefone,
      tipo: input.tipo,
      mensagem: input.mensagem,
      agendadaPara: input.agendadaPara,
    });
  }

  async processarFila(lote = 20): Promise<{ processadas: number; enviadas: number; falhas: number }> {
    const pendentes = await this.repo.proximasParaEnvio(lote);
    let enviadas = 0;
    let falhas = 0;

    for (const n of pendentes) {
      const resp = await zapiClient.enviarTexto(n.telefoneDestino, n.mensagem);
      const tentativas = n.tentativas + 1;
      if (resp.sucesso) {
        await this.repo.atualizarStatus(n.id, 'ENVIADA', tentativas, resp);
        enviadas += 1;
      } else {
        const status = tentativas >= 3 ? 'FALHA' : 'PENDENTE';
        await this.repo.atualizarStatus(n.id, status, tentativas, resp);
        falhas += 1;
      }
    }

    return { processadas: pendentes.length, enviadas, falhas };
  }

  doUsuario(usuarioId: string, limite = 50) {
    return this.repo.doUsuario(usuarioId, limite);
  }
}
