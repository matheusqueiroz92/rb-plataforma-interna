'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@rb/validators';
import type { RespostaLogin } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaLogin() {
  const router = useRouter();
  const definirSessao = useAuthStore((s) => s.definirSessao);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(dados: LoginInput): Promise<void> {
    setErro(null);
    setEnviando(true);
    try {
      const resp = await apiClient.post<RespostaLogin>('/auth/login', dados);
      definirSessao(resp);
      router.replace(resp.usuario.precisaAceitarPop ? '/aceite-pop' : '/dashboard');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha na autenticacao.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md cartao-institucional p-10 animate-rise">
        <header className="text-center mb-8">
          <div className="font-lapidar text-gold-500 text-xl tracking-[0.3em] mb-2">RB</div>
          <h1 className="font-serif text-3xl text-navy-900 leading-tight">
            Reboucas &amp; Bulhoes
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mt-1">
            Advogados Associados
          </p>
          <div className="mt-6 h-px bg-gold-500/40" />
          <p className="mt-6 text-sm text-gray-500">Plataforma Interna</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label-institucional" htmlFor="email">
              E-mail institucional
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input-institucional"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-institucional-red">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label-institucional" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              className="input-institucional"
              {...register('senha')}
            />
            {errors.senha && (
              <p className="mt-1 text-xs text-institucional-red">{errors.senha.message}</p>
            )}
          </div>

          {erro && (
            <div className="rounded-md border border-institucional-red/30 bg-institucional-red/10 px-4 py-3 text-sm text-institucional-red">
              {erro}
            </div>
          )}

          <button type="submit" disabled={enviando} className="btn-primario w-full">
            {enviando ? 'Acessando...' : 'Acessar plataforma'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Acesso restrito. Uso exclusivo de colaboradores autorizados.
        </p>
      </div>
    </main>
  );
}
