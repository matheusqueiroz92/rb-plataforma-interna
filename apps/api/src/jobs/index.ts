import cron, { type ScheduledTask } from 'node-cron';

import { logger } from '../shared/logger/logger.js';
import { lembretePonto } from './lembrete-ponto.job.js';
import { alertaPrazo } from './alerta-prazo.job.js';
import { rankingSemanal } from './ranking-semanal.job.js';
import { lembreteRelatorio } from './lembrete-relatorio.job.js';
import { processarFilaWhatsapp } from './fila-whatsapp.job.js';

const TZ = 'America/Bahia';

async function envolver(nome: string, fn: () => Promise<void>): Promise<void> {
  try {
    logger.info(`Job iniciado: ${nome}`);
    await fn();
    logger.info(`Job concluido: ${nome}`);
  } catch (erro) {
    logger.error(`Job falhou: ${nome}`, { erro });
  }
}

export function iniciarJobs(): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];

  tasks.push(
    cron.schedule('30 8 * * 1-5', () => void envolver('lembrete-ponto', lembretePonto), {
      timezone: TZ,
    }),
  );

  tasks.push(
    cron.schedule('0 7 * * 1-5', () => void envolver('alerta-prazo', alertaPrazo), {
      timezone: TZ,
    }),
  );

  tasks.push(
    cron.schedule('0 7 * * 1', () => void envolver('ranking-semanal', rankingSemanal), {
      timezone: TZ,
    }),
  );

  tasks.push(
    cron.schedule('0 19 * * 1-5', () => void envolver('lembrete-relatorio', lembreteRelatorio), {
      timezone: TZ,
    }),
  );

  tasks.push(
    cron.schedule('* * * * *', () => void envolver('fila-whatsapp', processarFilaWhatsapp), {
      timezone: TZ,
    }),
  );

  for (const t of tasks) t.start();
  logger.info(`Cron jobs iniciados: ${tasks.length} tarefas agendadas`);
  return tasks;
}

export function pararJobs(tasks: ScheduledTask[]): void {
  for (const t of tasks) t.stop();
}
