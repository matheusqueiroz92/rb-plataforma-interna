'use client';

import Link from 'next/link';
import { Clock, FileText, CheckSquare, Users, TrendingUp, Briefcase } from 'lucide-react';
import { ROTULOS_PERFIL } from '@rb/utils';

import { useAuthStore } from '@/stores/auth-store';

const atalhos = [
  { href: '/ponto', titulo: 'Ponto Digital', descricao: 'Registrar entrada, intervalos e saida.', Icone: Clock },
  { href: '/relatorio', titulo: 'Relatorio Diario', descricao: 'Enviar relatorio obrigatorio antes da saida.', Icone: FileText },
  { href: '/checklist', titulo: 'Checklist 5S', descricao: 'Rotinas Seiri, Seiton, Seiso, Seiketsu, Shitsuke.', Icone: CheckSquare },
  { href: '/demandas', titulo: 'Demandas', descricao: 'Atribuicoes, entregas e correcoes da semana.', Icone: Briefcase },
  { href: '/produtividade', titulo: 'Produtividade', descricao: 'Ranking semanal e meu desempenho.', Icone: TrendingUp },
  { href: '/dashboard', titulo: 'Equipe', descricao: 'Visao geral da equipe (em expansao).', Icone: Users },
];

export default function PaginaDashboard() {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return null;

  return (
    <div className="animate-rise space-y-8">
      <section>
        <h1 className="secao-titulo">Bem-vinda, {usuario.nome.split(' ')[0]}.</h1>
        <p className="text-gray-500 mt-2 pl-4">
          Perfil: <span className="font-semibold">{ROTULOS_PERFIL[usuario.perfil]}</span> &middot;
          Matricula: <span className="font-mono">{usuario.matricula}</span>
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {atalhos.map((a) => (
          <Link
            key={a.titulo}
            href={a.href}
            className="cartao-institucional p-6 hover:shadow-elevated transition-shadow"
          >
            <div className="h-10 w-10 rounded-md bg-navy-900 text-gold-500 flex items-center justify-center mb-4">
              <a.Icone className="h-5 w-5" />
            </div>
            <div className="font-serif text-lg text-navy-900">{a.titulo}</div>
            <p className="text-sm text-gray-500 mt-1">{a.descricao}</p>
          </Link>
        ))}
      </section>

      <section className="cartao-institucional p-6">
        <h2 className="secao-titulo text-xl">Conformidade institucional</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-gray-900">
          <li>
            <span className="badge badge-ok">Lei 11.788/2008</span>
            <p className="mt-1 text-xs text-gray-500">
              Jornada, supervisao e atividades compativeis com o curso.
            </p>
          </li>
          <li>
            <span className="badge badge-ok">LGPD</span>
            <p className="mt-1 text-xs text-gray-500">
              Consentimento registrado e trilha de auditoria ativa.
            </p>
          </li>
          <li>
            <span className="badge badge-ok">Estatuto da OAB</span>
            <p className="mt-1 text-xs text-gray-500">
              Sigilo profissional e controle de acesso a dados de clientes.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
