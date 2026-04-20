import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Perfil } from '@rb/constants';
import { HIERARQUIA_PERFIL } from '@rb/constants';

import { env } from '../config/env.js';
import { ErroAutenticacao, ErroAutorizacao } from '../shared/errors/app-error.js';
import { prisma } from '../shared/prisma/prisma.js';

export interface PayloadToken {
  sub: string;
  perfil: Perfil;
  matricula: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: PayloadToken;
    user: { id: string; perfil: Perfil; matricula: string; nome: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    autenticar: (req: FastifyRequest) => Promise<void>;
    exigirPerfil: (perfis: Perfil[]) => (req: FastifyRequest) => Promise<void>;
    exigirNivelMinimo: (perfil: Perfil) => (req: FastifyRequest) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.decorate('autenticar', async (req: FastifyRequest): Promise<void> => {
    try {
      await req.jwtVerify();
    } catch {
      throw new ErroAutenticacao('Token invalido ou expirado');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, perfil: true, matricula: true, nome: true, status: true },
    });
    if (!usuario) throw new ErroAutenticacao('Usuario nao encontrado');
    if (usuario.status !== 'ATIVO') throw new ErroAutenticacao('Usuario inativo');

    req.user = {
      id: usuario.id,
      perfil: usuario.perfil,
      matricula: usuario.matricula,
      nome: usuario.nome,
    };
  });

  app.decorate('exigirPerfil', (perfis: Perfil[]) => {
    return async (req: FastifyRequest): Promise<void> => {
      if (!req.user) throw new ErroAutenticacao();
      if (!perfis.includes(req.user.perfil)) {
        throw new ErroAutorizacao('Seu perfil nao tem permissao para esta acao.');
      }
    };
  });

  app.decorate('exigirNivelMinimo', (perfilMinimo: Perfil) => {
    const minimo = HIERARQUIA_PERFIL[perfilMinimo];
    return async (req: FastifyRequest): Promise<void> => {
      if (!req.user) throw new ErroAutenticacao();
      if (HIERARQUIA_PERFIL[req.user.perfil] < minimo) {
        throw new ErroAutorizacao('Seu perfil nao tem permissao suficiente.');
      }
    };
  });
}, { name: 'auth-plugin' });

import jwt from 'jsonwebtoken';

export function assinarRefresh(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export function verificarRefresh(token: string): PayloadToken {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as PayloadToken;
}
