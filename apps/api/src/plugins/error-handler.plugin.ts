import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { AppError } from '../shared/errors/app-error.js';
import { logger } from '../shared/logger/logger.js';
import { env } from '../config/env.js';

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((erro: FastifyError, req, reply) => {
    if (erro instanceof ZodError) {
      return reply.status(422).send({
        codigo: 'VALIDACAO',
        mensagem: 'Dados invalidos na requisicao.',
        detalhes: erro.issues.map((i) => ({
          caminho: i.path.join('.'),
          mensagem: i.message,
        })),
      });
    }

    if (erro instanceof AppError) {
      return reply.status(erro.status).send({
        codigo: erro.codigo,
        mensagem: erro.message,
        detalhes: erro.detalhes,
      });
    }

    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        return reply.status(409).send({
          codigo: 'CONFLITO',
          mensagem: 'Registro duplicado.',
          detalhes: erro.meta,
        });
      }
      if (erro.code === 'P2025') {
        return reply.status(404).send({
          codigo: 'NAO_ENCONTRADO',
          mensagem: 'Registro nao encontrado.',
        });
      }
    }

    if (erro.validation) {
      return reply.status(422).send({
        codigo: 'VALIDACAO',
        mensagem: 'Dados invalidos na requisicao.',
        detalhes: erro.validation,
      });
    }

    if (erro.statusCode && erro.statusCode < 500) {
      return reply.status(erro.statusCode).send({
        codigo: erro.code ?? 'ERRO',
        mensagem: erro.message,
      });
    }

    logger.error('Erro nao tratado', {
      mensagem: erro.message,
      stack: erro.stack,
      url: req.url,
      metodo: req.method,
      usuarioId: req.user?.id,
    });

    return reply.status(500).send({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno do servidor.',
      detalhes: env.NODE_ENV === 'development' ? erro.stack : undefined,
    });
  });
}, { name: 'error-handler-plugin' });
