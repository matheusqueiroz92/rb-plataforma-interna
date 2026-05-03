'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trocarSenhaSchema, type TrocarSenhaInput } from '@rb/validators';
import { LockKeyhole } from 'lucide-react';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaConta() {
  const token = useAuthStore((s) => s.accessToken);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrocarSenhaInput>({
    resolver: zodResolver(trocarSenhaSchema),
  });

  async function onSubmit(dados: TrocarSenhaInput): Promise<void> {
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      await apiClient.post('/auth/trocar-senha', dados, token);
      setSucesso('Senha alterada com sucesso.');
      reset();
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="animate-rise space-y-6 max-w-2xl">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <LockKeyhole className="h-6 w-6 text-gold-500" /> Minha conta
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Atualize sua senha de acesso conforme a politica de seguranca da plataforma.
        </p>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="rounded-md bg-institucional-green/10 text-institucional-green border border-institucional-green/30 px-4 py-3 text-sm">
          {sucesso}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="cartao-institucional p-6 space-y-5">
        <div>
          <label className="label-institucional">Senha atual</label>
          <input type="password" className="input-institucional" {...register('senhaAtual')} />
          {errors.senhaAtual && (
            <p className="mt-1 text-xs text-institucional-red">{errors.senhaAtual.message}</p>
          )}
        </div>
        <div>
          <label className="label-institucional">Nova senha</label>
          <input type="password" className="input-institucional" {...register('novaSenha')} />
          {errors.novaSenha && (
            <p className="mt-1 text-xs text-institucional-red">{errors.novaSenha.message}</p>
          )}
        </div>
        <button type="submit" disabled={salvando} className="btn-primario w-full">
          {salvando ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}
