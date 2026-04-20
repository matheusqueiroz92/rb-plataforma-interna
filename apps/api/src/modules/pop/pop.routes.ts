import type { FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';

import { env } from '../../config/env.js';
import { ErroNaoEncontrado } from '../../shared/errors/app-error.js';

export async function popRoutes(app: FastifyInstance): Promise<void> {
  app.get('/versao-atual', { onRequest: [app.autenticar] }, async () => ({
    versao: env.POP_EST_VERSAO_ATUAL,
  }));

  app.get('/texto', { onRequest: [app.autenticar] }, async () => {
    const candidatos = [
      path.resolve(process.cwd(), 'docs', 'POP-EST-001.md'),
      path.resolve(process.cwd(), '..', '..', 'docs', 'POP-EST-001.md'),
      path.resolve(process.cwd(), '..', 'docs', 'POP-EST-001.md'),
    ];

    for (const caminho of candidatos) {
      try {
        const texto = await fs.readFile(caminho, 'utf-8');
        return { versao: env.POP_EST_VERSAO_ATUAL, texto };
      } catch {
        // tenta proximo candidato
      }
    }

    throw new ErroNaoEncontrado('Texto do POP-EST-001');
  });
}
