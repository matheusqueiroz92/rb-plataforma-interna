'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';
import { formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface CursoProgresso {
  curso: {
    id: string;
    titulo: string;
    descricao: string | null;
    obrigatorio: boolean;
    perfilAlvo: string;
    conclusaoObrigatoriaDias: number | null;
    urlExterna: string | null;
  };
  concluidoEm: string | null;
  certificadoUrl: string | null;
}

export default function PaginaCursos() {
  const token = useAuthStore((s) => s.accessToken);
  const [dados, setDados] = useState<CursoProgresso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    try {
      const r = await apiClient.get<{ dados: CursoProgresso[] }>(
        '/cursos/meu-progresso',
        token,
      );
      setDados(r.dados);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function marcarConcluido(cursoId: string): Promise<void> {
    try {
      await apiClient.post('/cursos/concluir', { cursoId }, token);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-gold-500" /> Cursos e Trilhas
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Trilhas obrigatorias e complementares do escritorio.
        </p>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {dados?.map(({ curso, concluidoEm, certificadoUrl }) => (
          <article key={curso.id} className="cartao-institucional p-6">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex flex-wrap gap-2">
                {curso.obrigatorio && <span className="badge badge-critico">Obrigatorio</span>}
                <span className="badge badge-info">{curso.perfilAlvo}</span>
              </div>
              {concluidoEm && (
                <CheckCircle2 className="h-6 w-6 text-institucional-green flex-shrink-0" />
              )}
            </div>

            <h2 className="font-serif text-lg text-navy-900">{curso.titulo}</h2>
            {curso.descricao && (
              <p className="text-sm text-gray-500 mt-2">{curso.descricao}</p>
            )}

            {curso.conclusaoObrigatoriaDias && !concluidoEm && (
              <p className="text-xs text-institucional-amber mt-3">
                Conclusao obrigatoria em ate {curso.conclusaoObrigatoriaDias} dias.
              </p>
            )}

            {concluidoEm && (
              <p className="text-xs text-institucional-green mt-3">
                Concluido em {formatarDataBR(concluidoEm)}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              {curso.urlExterna && (
                <a
                  href={curso.urlExterna}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline flex-1"
                >
                  <ExternalLink className="h-4 w-4" /> Acessar
                </a>
              )}
              {!concluidoEm && (
                <button
                  type="button"
                  onClick={() => void marcarConcluido(curso.id)}
                  className="btn-primario flex-1"
                >
                  Marcar como concluido
                </button>
              )}
              {certificadoUrl && (
                <a
                  href={certificadoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-dourado flex-1"
                >
                  Ver certificado
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
