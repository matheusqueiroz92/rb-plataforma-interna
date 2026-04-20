import type { FastifyRequest } from 'fastify';

export function extrairIp(req: FastifyRequest): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0]!.trim();
  }
  return req.ip ?? 'desconhecido';
}

export function extrairUserAgent(req: FastifyRequest): string {
  const ua = req.headers['user-agent'];
  return (typeof ua === 'string' ? ua : 'desconhecido').slice(0, 500);
}
