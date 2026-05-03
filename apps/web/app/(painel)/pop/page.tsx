'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Send, CheckCircle2, Rocket } from 'lucide-react';
import { criarPopSchema, type CriarPopInput } from '@rb/validators';
import {
  PERFIS,
  STATUS_POP_DOCUMENTO,
  HIERARQUIA_PERFIL,
  type Perfil,
  type StatusPopDocumento,
} from '@rb/constants';
import { ROTULOS_PERFIL } from '@rb/utils';
import type { PopDocumentoDTO, RespostaLista } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const ROTULOS_STATUS: Record<StatusPopDocumento, string> = {
  RASCUNHO: 'Rascunho',
  APROVADO: 'Aprovado',
  PUBLICADO: 'Publicado',
};

export default function PaginaPop() {
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [lista, setLista] = useState<PopDocumentoDTO[]>([]);
  const [perfilFiltro, setPerfilFiltro] = useState<Perfil | ''>('');
  const [statusFiltro, setStatusFiltro] = useState<StatusPopDocumento | ''>('');
  const [selecionado, setSelecionado] = useState<PopDocumentoDTO | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const podeGerenciar =
    usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.GESTORA ? true : false;

  const formCriar = useForm<CriarPopInput>({
    resolver: zodResolver(criarPopSchema),
    defaultValues: { perfil: 'ESTAGIARIO', titulo: '', conteudoMarkdown: '' },
  });

  async function carregar(): Promise<void> {
    if (!token) return;
    setCarregando(true);
    setErro(null);
    try {
      const query = new URLSearchParams();
      if (perfilFiltro) query.set('perfil', perfilFiltro);
      if (statusFiltro) query.set('status', statusFiltro);
      const sufixo = query.toString() ? `?${query.toString()}` : '';
      const resp = await apiClient.get<RespostaLista<PopDocumentoDTO>>(`/pop${sufixo}`, token);
      setLista(resp.dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao carregar POPs.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (podeGerenciar) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, perfilFiltro, statusFiltro, podeGerenciar]);

  async function criar(dados: CriarPopInput): Promise<void> {
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const novo = await apiClient.post<PopDocumentoDTO>('/pop', dados, token);
      setSucesso('POP criado como rascunho.');
      setSelecionado(novo);
      formCriar.reset({ perfil: dados.perfil, titulo: '', conteudoMarkdown: '' });
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao criar POP.');
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarSelecionado(): Promise<void> {
    if (!selecionado) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const atualizado = await apiClient.put<PopDocumentoDTO>(
        `/pop/${selecionado.id}`,
        {
          titulo: selecionado.titulo,
          conteudoMarkdown: selecionado.conteudoMarkdown,
        },
        token,
      );
      setSelecionado(atualizado);
      setSucesso('Rascunho atualizado.');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao atualizar POP.');
    } finally {
      setSalvando(false);
    }
  }

  async function aprovarSelecionado(): Promise<void> {
    if (!selecionado) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const atualizado = await apiClient.post<PopDocumentoDTO>(
        `/pop/${selecionado.id}/aprovar`,
        {},
        token,
      );
      setSelecionado(atualizado);
      setSucesso('POP aprovado com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao aprovar POP.');
    } finally {
      setSalvando(false);
    }
  }

  async function publicarSelecionado(): Promise<void> {
    if (!selecionado) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const atualizado = await apiClient.post<PopDocumentoDTO>(
        `/pop/${selecionado.id}/publicar`,
        {},
        token,
      );
      setSelecionado(atualizado);
      setSucesso('POP publicado e definido como vigente.');
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao publicar POP.');
    } finally {
      setSalvando(false);
    }
  }

  if (!podeGerenciar) {
    return (
      <div className="cartao-institucional p-8 text-center text-gray-500">
        Voce nao possui permissao para gerenciar POPs.
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="secao-titulo flex items-center gap-2">
          <FileText className="h-6 w-6 text-gold-500" /> POPs por perfil
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Controle de versoes, aprovacao e publicacao de POPs por cargo.
        </p>
      </header>

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

      <form onSubmit={formCriar.handleSubmit(criar)} className="cartao-institucional p-6 space-y-4">
        <h2 className="secao-titulo text-xl">Novo rascunho</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Perfil</label>
            <select className="select-institucional" {...formCriar.register('perfil')}>
              {PERFIS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {ROTULOS_PERFIL[perfil]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-institucional">Titulo</label>
            <input className="input-institucional" {...formCriar.register('titulo')} />
          </div>
        </div>
        <div>
          <label className="label-institucional">Conteudo markdown</label>
          <textarea
            rows={8}
            className="textarea-institucional"
            {...formCriar.register('conteudoMarkdown')}
          />
        </div>
        <button type="submit" disabled={salvando} className="btn-primario">
          <Send className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Criar rascunho'}
        </button>
      </form>

      <section className="cartao-institucional p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="label-institucional">Filtrar por perfil</span>
            <select
              className="select-institucional"
              value={perfilFiltro}
              onChange={(e) => setPerfilFiltro((e.target.value as Perfil | '') || '')}
            >
              <option value="">Todos</option>
              {PERFIS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {ROTULOS_PERFIL[perfil]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-institucional">Filtrar por status</span>
            <select
              className="select-institucional"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro((e.target.value as StatusPopDocumento | '') || '')}
            >
              <option value="">Todos</option>
              {STATUS_POP_DOCUMENTO.map((status) => (
                <option key={status} value={status}>
                  {ROTULOS_STATUS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {carregando && <div className="cartao-institucional p-6 text-sm text-gray-500">Carregando POPs...</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <ul className="space-y-3">
          {lista.map((pop) => (
            <li key={pop.id} className="cartao-institucional p-4">
              <button type="button" className="w-full text-left space-y-2" onClick={() => setSelecionado(pop)}>
                <div className="font-serif text-lg text-navy-900">{pop.titulo}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-info">{ROTULOS_PERFIL[pop.perfil]}</span>
                  <span className="badge badge-pendente">{ROTULOS_STATUS[pop.status]}</span>
                  {pop.vigente && <span className="badge badge-sucesso">Vigente</span>}
                </div>
                <div className="text-xs text-gray-500">
                  Versao {pop.versao} - atualizado em {new Date(pop.atualizadoEm).toLocaleString('pt-BR')}
                </div>
              </button>
            </li>
          ))}
          {!carregando && lista.length === 0 && (
            <li className="cartao-institucional p-6 text-sm text-gray-500">Nenhum POP encontrado.</li>
          )}
        </ul>

        <section className="cartao-institucional p-5 space-y-4">
          {!selecionado ? (
            <p className="text-sm text-gray-500">Selecione um POP para revisar e executar acoes.</p>
          ) : (
            <>
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-navy-900">{selecionado.titulo}</h3>
                <div className="text-xs text-gray-500">
                  Perfil {ROTULOS_PERFIL[selecionado.perfil]} | Versao {selecionado.versao}
                </div>
              </div>

              <input
                className="input-institucional"
                value={selecionado.titulo}
                onChange={(e) => setSelecionado({ ...selecionado, titulo: e.target.value })}
                disabled={selecionado.status === 'PUBLICADO'}
              />
              <textarea
                rows={12}
                className="textarea-institucional"
                value={selecionado.conteudoMarkdown}
                onChange={(e) => setSelecionado({ ...selecionado, conteudoMarkdown: e.target.value })}
                disabled={selecionado.status === 'PUBLICADO'}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primario"
                  disabled={salvando || selecionado.status === 'PUBLICADO'}
                  onClick={() => void atualizarSelecionado()}
                >
                  <Send className="h-4 w-4" /> Salvar rascunho
                </button>
                <button
                  type="button"
                  className="btn-dourado"
                  disabled={salvando || selecionado.status === 'PUBLICADO'}
                  onClick={() => void aprovarSelecionado()}
                >
                  <CheckCircle2 className="h-4 w-4" /> Aprovar
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={salvando || selecionado.status !== 'APROVADO'}
                  onClick={() => void publicarSelecionado()}
                >
                  <Rocket className="h-4 w-4" /> Publicar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
