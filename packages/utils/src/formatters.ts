import type { Perfil, TipoPonto, StatusDemanda, PrioridadeDemanda } from '@rb/constants';

export const ROTULOS_PERFIL: Record<Perfil, string> = {
  SOCIO: 'Socio',
  GESTORA: 'Gestora',
  ASSESSORA_JR: 'Assessora junior',
  ESTAGIARIO: 'Estagiario',
};

export const ROTULOS_TIPO_PONTO: Record<TipoPonto, string> = {
  ENTRADA: 'Entrada',
  SAIDA_ALMOCO: 'Saida para almoco',
  RETORNO_ALMOCO: 'Retorno do almoco',
  SAIDA_FINAL: 'Saida final',
};

export const ROTULOS_STATUS_DEMANDA: Record<StatusDemanda, string> = {
  PENDENTE: 'Pendente',
  ANDAMENTO: 'Em andamento',
  ENTREGUE: 'Entregue',
  EM_CORRECAO: 'Em correcao',
  CONCLUIDA: 'Concluida',
  VENCIDA: 'Vencida',
};

export const ROTULOS_PRIORIDADE: Record<PrioridadeDemanda, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function sanitizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function iniciaisNome(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatarMatricula(prefixo: string, numero: number): string {
  return `${prefixo}-${String(numero).padStart(4, '0')}`;
}
