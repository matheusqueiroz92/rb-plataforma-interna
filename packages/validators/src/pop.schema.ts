import { z } from 'zod';
import { PERFIS, STATUS_POP_DOCUMENTO } from '@rb/constants';

export const statusPopDocumentoSchema = z.enum(STATUS_POP_DOCUMENTO);

export const filtroPopSchema = z.object({
  perfil: z.enum(PERFIS).optional(),
  status: statusPopDocumentoSchema.optional(),
});
export type FiltroPopInput = z.infer<typeof filtroPopSchema>;

export const criarPopSchema = z.object({
  perfil: z.enum(PERFIS),
  titulo: z.string().min(5).max(200),
  conteudoMarkdown: z.string().min(30),
});
export type CriarPopInput = z.infer<typeof criarPopSchema>;

export const atualizarPopSchema = z.object({
  titulo: z.string().min(5).max(200).optional(),
  conteudoMarkdown: z.string().min(30).optional(),
});
export type AtualizarPopInput = z.infer<typeof atualizarPopSchema>;
