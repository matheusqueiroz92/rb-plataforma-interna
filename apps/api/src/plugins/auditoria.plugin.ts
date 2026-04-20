import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AcaoAuditoria } from '@rb/constants';

import { prisma } from '../shared/prisma/prisma.js';
import { logger } from '../shared/logger/logger.js';
import { extrairIp, extrairUserAgent } from '../shared/ip/ip.js';

export interface RegistrarAuditoriaOpts {
  req?: FastifyRequest;
  usuarioId?: string | null;
  acao: AcaoAuditoria | string;
  entidade: string;
  entidadeId?: string | null;
  dadosAnteriores?: unknown;
  dadosNovos?: unknown;
}

declare module 'fastify' {
  interface FastifyInstance {
    registrarAuditoria: (opts: RegistrarAuditoriaOpts) => Promise<void>;
  }
}

export const auditoriaPlugin = fp(async (app: FastifyInstance) => {
  app.decorate('registrarAuditoria', async (opts: RegistrarAuditoriaOpts): Promise<void> => {
    try {
      await prisma.auditoriaLog.create({
        data: {
          usuarioId: opts.usuarioId ?? opts.req?.user?.id ?? null,
          acao: opts.acao,
          entidade: opts.entidade,
          entidadeId: opts.entidadeId ?? null,
          dadosAnteriores: opts.dadosAnteriores as never,
          dadosNovos: opts.dadosNovos as never,
          ip: opts.req ? extrairIp(opts.req) : null,
          userAgent: opts.req ? extrairUserAgent(opts.req) : null,
        },
      });
    } catch (erro) {
      logger.error('Falha ao registrar auditoria', {
        erro,
        acao: opts.acao,
        entidade: opts.entidade,
      });
    }
  });
}, { name: 'auditoria-plugin' });
