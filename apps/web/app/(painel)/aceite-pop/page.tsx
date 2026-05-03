'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import type { Perfil } from '@rb/constants';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface RespostaPop {
  id: string;
  perfil: string;
  titulo: string;
  versao: string;
  conteudoMarkdown: string;
}

export default function PaginaAceitePop() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  const usuario = useAuthStore((s) => s.usuario);
  const [pop, setPop] = useState<RespostaPop | null>(null);
  const [aceiteConfirmado, setAceiteConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const dado = await apiClient.get<RespostaPop>('/pop/vigente/atual', token);
        setPop(dado);
      } catch (e) {
        setErro(e instanceof ApiError ? e.mensagem : 'Nao foi possivel carregar o POP.');
      }
    }
    if (token) void carregar();
  }, [token]);

  async function aceitar(): Promise<void> {
    if (!pop) return;
    setEnviando(true);
    setErro(null);
    try {
      await apiClient.post<{ sucesso: boolean; popId: string }>(
        '/auth/aceitar-pop',
        { popId: pop.id },
        token,
      );
      atualizarUsuario({
        aceitePopVersao: pop.versao,
        aceitePopPerfil: pop.perfil as Perfil,
        precisaAceitarPop: false,
      });
      router.replace('/dashboard');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao registrar aceite.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-gold-500" /> Procedimento Operacional Padrao
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          {usuario?.nome}, leia o texto integral do POP{pop ? ` ${pop.titulo} (versao ${pop.versao})` : ''}. O
          aceite e obrigatorio para liberar o acesso a plataforma.
        </p>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <article className="cartao-institucional p-8 max-h-[60vh] overflow-y-auto">
        {pop ? (
          <div className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed text-sm">
            {pop.conteudoMarkdown}
          </div>
        ) : (
          <p className="text-gray-500">Carregando texto do POP...</p>
        )}
      </article>

      <section className="cartao-institucional p-6 space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-gold-500"
            checked={aceiteConfirmado}
            onChange={(e) => setAceiteConfirmado(e.target.checked)}
          />
          <span className="text-sm text-gray-900">
            Declaro que li integralmente o POP selecionado para meu perfil, compreendi suas disposicoes e me comprometo a
            observar os deveres, direitos e condutas nele descritos, nos termos da Lei 11.788/2008, da
            Lei 13.709/2018 (LGPD) e do Estatuto da OAB.
          </span>
        </label>

        <button
          onClick={aceitar}
          disabled={!aceiteConfirmado || !pop || enviando}
          className="btn-primario w-full"
        >
          <CheckCircle2 className="h-4 w-4" />
          {enviando ? 'Registrando aceite...' : 'Registrar aceite e acessar plataforma'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Registro de aceite: data, hora, IP e User-Agent sao armazenados em trilha de auditoria.
        </p>
      </section>
    </div>
  );
}
