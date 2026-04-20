import { z } from 'zod';
import { CATEGORIAS_CHECKLIST, PERFIS_CHECKLIST } from '@rb/constants';

export const categoriaChecklistSchema = z.enum(CATEGORIAS_CHECKLIST);
export const perfilChecklistSchema = z.enum(PERFIS_CHECKLIST);

export const criarItemChecklistSchema = z.object({
  categoria: categoriaChecklistSchema,
  perfilAlvo: perfilChecklistSchema.default('TODOS'),
  texto: z.string().min(10).max(500),
  obrigatorio: z.boolean().default(true),
  aplicaRemoto: z.boolean().default(true),
  aplicaPresencial: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});
export type CriarItemChecklistInput = z.infer<typeof criarItemChecklistSchema>;

export const atualizarItemChecklistSchema = criarItemChecklistSchema.partial();
export type AtualizarItemChecklistInput = z.infer<typeof atualizarItemChecklistSchema>;

export const responderChecklistSchema = z.object({
  itemId: z.string().uuid(),
  concluido: z.boolean(),
  melhoriaSugerida: z.string().max(500).optional(),
});
export type ResponderChecklistInput = z.infer<typeof responderChecklistSchema>;
