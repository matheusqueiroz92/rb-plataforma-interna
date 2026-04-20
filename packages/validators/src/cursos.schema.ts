import { z } from 'zod';

export const criarCursoSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().optional(),
  obrigatorio: z.boolean().default(false),
  perfilAlvo: z.string().max(50),
  conclusaoObrigatoriaDias: z.number().int().positive().optional(),
  urlExterna: z.string().url().max(500).optional(),
});
export type CriarCursoInput = z.infer<typeof criarCursoSchema>;

export const atualizarCursoSchema = criarCursoSchema.partial().extend({
  ativo: z.boolean().optional(),
});
export type AtualizarCursoInput = z.infer<typeof atualizarCursoSchema>;

export const concluirCursoSchema = z.object({
  cursoId: z.string().uuid(),
  certificadoUrl: z.string().url().max(500).optional(),
});
export type ConcluirCursoInput = z.infer<typeof concluirCursoSchema>;
