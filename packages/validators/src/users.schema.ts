import { z } from 'zod';
import { PERFIS, STATUS_USUARIO } from '@rb/constants';

export const perfilSchema = z.enum(PERFIS);
export const statusUsuarioSchema = z.enum(STATUS_USUARIO);

export const criarUsuarioSchema = z.object({
  nome: z.string().min(3).max(120),
  email: z.string().email().max(120),
  matricula: z.string().min(3).max(20),
  senhaInicial: z.string().min(8),
  perfil: perfilSchema,
  instituicaoEnsino: z.string().max(200).optional(),
  periodoCurso: z.string().max(20).optional(),
  dataAdmissao: z.coerce.date().optional(),
  telefoneWhatsapp: z.string().max(20).optional(),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(3).max(120).optional(),
  email: z.string().email().max(120).optional(),
  matricula: z.string().min(3).max(20).optional(),
  perfil: perfilSchema.optional(),
  status: statusUsuarioSchema.optional(),
  instituicaoEnsino: z.string().max(200).nullable().optional(),
  periodoCurso: z.string().max(20).nullable().optional(),
  dataAdmissao: z.coerce.date().nullable().optional(),
  dataDesligamento: z.coerce.date().nullable().optional(),
  telefoneWhatsapp: z.string().max(20).nullable().optional(),
});
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;

export const resetarSenhaSchema = z.object({
  novaSenha: z.string().min(8),
});
export type ResetarSenhaInput = z.infer<typeof resetarSenhaSchema>;
