import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'node:path';

import { env } from '../../config/env.js';

const logDir = path.resolve(process.cwd(), 'logs');

const rotativo = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'rb-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'rb-api' },
  transports: [
    rotativo,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});
