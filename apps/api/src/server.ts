import { criarApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/logger.js';
import { prisma } from './shared/prisma/prisma.js';
import { iniciarJobs, pararJobs } from './jobs/index.js';
import { encerrarBrowserPdf } from './integrations/pdf/pdf-generator.js';

async function iniciar(): Promise<void> {
  const app = await criarApp();
  try {
    await app.listen({ host: '0.0.0.0', port: env.API_PORT });
    logger.info(`API Fastify em execucao na porta ${env.API_PORT}`);
  } catch (erro) {
    logger.error('Falha ao iniciar API', { erro });
    process.exit(1);
  }

  const tasks = env.NODE_ENV === 'production' ? iniciarJobs() : [];

  const encerrar = async (sinal: string): Promise<void> => {
    logger.info(`Recebido ${sinal}. Encerrando API...`);
    pararJobs(tasks);
    await encerrarBrowserPdf();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void encerrar('SIGINT'));
  process.on('SIGTERM', () => void encerrar('SIGTERM'));
  process.on('unhandledRejection', (erro) => logger.error('Rejeicao nao tratada', { erro }));
  process.on('uncaughtException', (erro) => {
    logger.error('Excecao nao tratada', { erro });
    process.exit(1);
  });
}

void iniciar();
