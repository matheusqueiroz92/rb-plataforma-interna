import { z } from 'zod';

export const enviarMensagemIaSchema = z.object({
  conversaId: z.string().uuid().optional(),
  mensagem: z.string().min(1).max(8000),
});
export type EnviarMensagemIaInput = z.infer<typeof enviarMensagemIaSchema>;

export const listarConversasSchema = z.object({
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListarConversasInput = z.infer<typeof listarConversasSchema>;
