'use client';

import { useState } from 'react';
import { FileDown, Calendar } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';

const MESES = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export default function PaginaEspelhoPonto() {
  const token = useAuthStore((s) => s.accessToken);
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar(): Promise<void> {
    setBaixando(true);
    setErro(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? '/api';
      const resp = await fetch(
        `${base}/relatorios-gerenciais/espelho-ponto?mes=${mes}&ano=${ano}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.mensagem ?? 'Falha ao gerar espelho.');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar espelho.');
    } finally {
      setBaixando(false);
    }
  }

  const anos = Array.from({ length: 5 }, (_, i) => agora.getFullYear() - i);

  return (
    <div className="animate-rise space-y-6 max-w-2xl">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <Calendar className="h-6 w-6 text-gold-500" /> Espelho Mensal de Ponto
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Gere o PDF do espelho com todos os registros, horas trabalhadas e edicoes realizadas.
        </p>
      </section>

      <section className="cartao-institucional p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-institucional">Mes</label>
            <select
              className="select-institucional"
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value, 10))}
            >
              {MESES.map((nome, idx) => (
                <option key={nome} value={idx + 1}>
                  {idx + 1} - {nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-institucional">Ano</label>
            <select
              className="select-institucional"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value, 10))}
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erro && (
          <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <button
          type="button"
          onClick={() => void baixar()}
          disabled={baixando}
          className="btn-primario w-full"
        >
          <FileDown className="h-4 w-4" />
          {baixando ? 'Gerando PDF...' : 'Gerar espelho em PDF'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Registros editados pela gestora aparecem destacados em amarelo.
        </p>
      </section>
    </div>
  );
}
