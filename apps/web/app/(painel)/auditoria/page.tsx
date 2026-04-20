'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatarDataHoraBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface RegistroAuditoria {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dadosAnteriores: unknown;
  dadosNovos: unknown;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
  usuario: { id: string; nome: string; matricula: string; perfil: string } | null;
}

interface RespostaAuditoria {
  total: number;
  pagina: number;
  limite: number;
  dados: RegistroAuditoria[];
}

export default function PaginaAuditoria() {
  const token = useAuthStore((s) => s.accessToken);
  const [filtro, setFiltro] = useState({ entidade: '', usuario: '', de: '', ate: '' });
  const [dados, setDados] = useState<RespostaAuditoria | null>(null);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (filtro.entidade) params.set('entidade', filtro.entidade);
      if (filtro.usuario) params.set('usuario', filtro.usuario);
      if (filtro.de) params.set('de', filtro.de);
      if (filtro.ate) params.set('ate', filtro.ate);
      params.set('pagina', String(pagina));
      params.set('limite', '50');
      const r = await apiClient.get<RespostaAuditoria>(`/auditoria?${params}`, token);
      setDados(r);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pagina]);

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-gold-500" /> Trilha de Auditoria
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Registros imutaveis de todas as acoes sensiveis. Consulta restrita a gestora e socio.
        </p>
      </section>

      <section className="cartao-institucional p-5 grid md:grid-cols-4 gap-3">
        <input
          className="input-institucional"
          placeholder="Entidade (ex: Ponto, Usuario)"
          value={filtro.entidade}
          onChange={(e) => setFiltro({ ...filtro, entidade: e.target.value })}
        />
        <input
          className="input-institucional"
          placeholder="UUID do usuario"
          value={filtro.usuario}
          onChange={(e) => setFiltro({ ...filtro, usuario: e.target.value })}
        />
        <input
          type="date"
          className="input-institucional"
          value={filtro.de}
          onChange={(e) => setFiltro({ ...filtro, de: e.target.value })}
        />
        <input
          type="date"
          className="input-institucional"
          value={filtro.ate}
          onChange={(e) => setFiltro({ ...filtro, ate: e.target.value })}
        />
        <button
          type="button"
          onClick={() => {
            setPagina(1);
            void carregar();
          }}
          className="btn-primario md:col-span-4"
        >
          Aplicar filtros
        </button>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {dados && (
        <section className="cartao-institucional overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{dados.total} registros</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
                className="px-3 py-1 rounded-md border border-gray-100 disabled:opacity-50"
              >
                Anterior
              </button>
              <span>Pagina {pagina}</span>
              <button
                type="button"
                disabled={dados.dados.length < dados.limite}
                onClick={() => setPagina((p) => p + 1)}
                className="px-3 py-1 rounded-md border border-gray-100 disabled:opacity-50"
              >
                Proxima
              </button>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-navy-900 text-cream">
              <tr>
                <th className="text-left px-3 py-2 uppercase tracking-wider">Data</th>
                <th className="text-left px-3 py-2 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-3 py-2 uppercase tracking-wider">Acao</th>
                <th className="text-left px-3 py-2 uppercase tracking-wider">Entidade</th>
                <th className="text-left px-3 py-2 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody>
              {dados.dados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-100/40">
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {formatarDataHoraBR(r.timestamp)}
                  </td>
                  <td className="px-3 py-2">
                    {r.usuario ? (
                      <>
                        <div className="font-semibold">{r.usuario.nome}</div>
                        <div className="text-gray-500">{r.usuario.perfil}</div>
                      </>
                    ) : (
                      <span className="text-gray-500">(sistema)</span>
                    )}
                  </td>
                  <td className="px-3 py-2"><span className="badge badge-info">{r.acao}</span></td>
                  <td className="px-3 py-2">
                    <div>{r.entidade}</div>
                    {r.entidadeId && (
                      <div className="text-gray-500 font-mono text-[10px]">{r.entidadeId}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-500">{r.ip ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
