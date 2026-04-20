'use client';

import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import { formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface CertificadoItem {
  id: string;
  tipo: string;
  periodoReferencia: string;
  pontuacaoObtida: number | null;
  posicaoFinal: number | null;
  emitidoEm: string;
  pdfUrl: string | null;
  numeroSequencial: string;
}

export default function PaginaCertificados() {
  const token = useAuthStore((s) => s.accessToken);
  const [dados, setDados] = useState<CertificadoItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const r = await apiClient.get<{ dados: CertificadoItem[] }>('/certificados/meus', token);
        setDados(r.dados);
      } catch (e) {
        if (e instanceof ApiError) setErro(e.mensagem);
      }
    }
    if (token) void carregar();
  }, [token]);

  async function baixar(id: string, numero: string): Promise<void> {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/certificados/${id}/download`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!resp.ok) throw new Error('Falha ao baixar');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${numero}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao baixar certificado.');
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <Award className="h-6 w-6 text-gold-500" /> Certificados
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Reconhecimentos semanais, mensais, anuais e destaques emitidos pela gestora.
        </p>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {dados?.length === 0 && (
        <div className="cartao-institucional p-8 text-center text-gray-500">
          Voce ainda nao possui certificados emitidos.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dados?.map((c) => (
          <article key={c.id} className="cartao-institucional p-6">
            <div className="flex items-start justify-between">
              <span className="badge badge-info">{c.tipo}</span>
              <span className="font-mono text-xs text-gray-500">{c.numeroSequencial}</span>
            </div>
            <div className="font-serif text-3xl text-navy-900 mt-4">
              {c.pontuacaoObtida ?? '-'}
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-500">pontos obtidos</div>
            <div className="text-sm text-gray-900 mt-3">
              Periodo: <strong>{c.periodoReferencia}</strong>
            </div>
            {c.posicaoFinal && (
              <div className="text-sm text-gray-900">
                Posicao: <strong>{c.posicaoFinal}&ordf;</strong>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Emitido em {formatarDataBR(c.emitidoEm)}
            </div>
            {c.pdfUrl && (
              <button
                type="button"
                onClick={() => void baixar(c.id, c.numeroSequencial)}
                className="btn-outline w-full mt-4"
              >
                <Download className="h-4 w-4" /> Baixar PDF
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
