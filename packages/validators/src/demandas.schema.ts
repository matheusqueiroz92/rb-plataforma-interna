import { z } from 'zod';
import {
  PRIORIDADES_DEMANDA,
  STATUS_DEMANDA,
  TIPOS_DEMANDA,
  NOTAS_CORRECAO,
} from '@rb/constants';

export const prioridadeSchema = z.enum(PRIORIDADES_DEMANDA);
export const statusDemandaSchema = z.enum(STATUS_DEMANDA);
export const tipoDemandaSchema = z.enum(TIPOS_DEMANDA);
export const notaCorrecaoSchema = z.union([z.literal(0), z.literal(8), z.literal(10)]);

export const criarDemandaSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().min(10),
  atribuidaAId: z.string().uuid(),
  tipo: tipoDemandaSchema,
  prioridade: prioridadeSchema.default('MEDIA'),
  processoCnj: z.string().max(25).optional(),
  clienteVinculado: z.string().max(150).optional(),
  prazoFatal: z.coerce.date().optional(),
  tempoEstimadoMinutos: z.number().int().positive().optional(),
  semanaReferencia: z.string().max(10).optional(),
});
export type CriarDemandaInput = z.infer<typeof criarDemandaSchema>;

export const delegarDemandaSchema = z.object({
  novoAtribuidoId: z.string().uuid(),
  motivoDelegacao: z.string().min(10).max(500).optional(),
});
export type DelegarDemandaInput = z.infer<typeof delegarDemandaSchema>;

export const atualizarStatusSchema = z.object({
  status: statusDemandaSchema,
  tempoRealMinutos: z.number().int().positive().optional(),
});
export type AtualizarStatusInput = z.infer<typeof atualizarStatusSchema>;

export const corrigirDemandaSchema = z.object({
  nota: notaCorrecaoSchema,
  feedback: z.string().min(10).max(2000),
});
export type CorrigirDemandaInput = z.infer<typeof corrigirDemandaSchema>;

export const filtroDemandasSchema = z.object({
  status: statusDemandaSchema.optional(),
  atribuidaA: z.string().uuid().optional(),
  semana: z.string().optional(),
  tipo: tipoDemandaSchema.optional(),
  prioridade: prioridadeSchema.optional(),
});
export type FiltroDemandasInput = z.infer<typeof filtroDemandasSchema>;
