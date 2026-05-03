'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ROTULOS_PERFIL } from '@rb/utils';
import { HIERARQUIA_PERFIL, type Perfil } from '@rb/constants';

import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface LinkNav {
  href: string;
  texto: string;
  nivelMinimo?: Perfil;
}

const links: LinkNav[] = [
  { href: '/dashboard', texto: 'Painel' },
  { href: '/equipe', texto: 'Equipe', nivelMinimo: 'GESTORA' },
  { href: '/pop', texto: 'POPs', nivelMinimo: 'GESTORA' },
  { href: '/resumo-equipe', texto: 'Resumo', nivelMinimo: 'ASSESSORA_JR' },
  { href: '/ponto', texto: 'Ponto' },
  { href: '/checklist', texto: 'Checklist' },
  { href: '/demandas', texto: 'Demandas' },
  { href: '/relatorio', texto: 'Relatorio' },
  { href: '/produtividade', texto: 'Produtividade' },
  { href: '/chat-ia', texto: 'IA' },
  { href: '/certificados', texto: 'Certificados' },
  { href: '/cursos', texto: 'Cursos' },
  { href: '/espelho-ponto', texto: 'Espelho' },
  { href: '/notificacoes', texto: 'Notif.' },
  { href: '/conta', texto: 'Conta' },
  { href: '/auditoria', texto: 'Auditoria', nivelMinimo: 'GESTORA' },
];

export function Cabecalho() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario = useAuthStore((s) => s.usuario);
  const accessToken = useAuthStore((s) => s.accessToken);
  const limpar = useAuthStore((s) => s.limpar);

  async function sair(): Promise<void> {
    if (accessToken) {
      try {
        await apiClient.post('/auth/logout', {}, accessToken);
      } catch {
        // limpeza local segue mesmo em falha de rede
      }
    }
    limpar();
    router.replace('/');
  }

  if (!usuario) return null;

  const linksVisiveis = links.filter((l) =>
    !l.nivelMinimo || HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL[l.nivelMinimo],
  );

  const LinkItem = ({ link, mobile = false }: { link: LinkNav; mobile?: boolean }) => (
    <Link
      href={link.href}
      onClick={() => mobile && setMenuAberto(false)}
      className={cn(
        'uppercase tracking-wide transition-colors',
        mobile ? 'block px-4 py-2 text-sm' : 'text-xs',
        pathname === link.href || pathname.startsWith(`${link.href}/`)
          ? 'text-gold-500'
          : 'text-cream hover:text-gold-500',
      )}
    >
      {link.texto}
    </Link>
  );

  return (
    <header className="bg-navy-900 text-cream border-b-2 border-gold-500">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
          <div className="font-lapidar text-gold-500 text-lg tracking-[0.25em]">RB</div>
          <div className="hidden lg:block">
            <div className="font-serif text-lg leading-none">Reboucas &amp; Bulhoes</div>
            <div className="text-[9px] tracking-[0.2em] uppercase text-gold-300 mt-1">
              Plataforma Interna
            </div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-4 flex-1 justify-center">
          {linksVisiveis.map((link) => (
            <LinkItem key={link.href} link={link} />
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden md:block">
            <div className="text-xs font-medium">{usuario.nome.split(' ')[0]}</div>
            <div className="text-[9px] uppercase tracking-wider text-gold-300">
              {ROTULOS_PERFIL[usuario.perfil]}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-navy-700 flex items-center justify-center">
            <User2 className="h-5 w-5 text-gold-500" />
          </div>
          <button
            onClick={() => void sair()}
            className="p-2 rounded-md hover:bg-navy-700 transition-colors"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            className="xl:hidden p-2 rounded-md hover:bg-navy-700"
            aria-label="Abrir menu"
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav className="xl:hidden bg-navy-800 border-t border-navy-700 py-2 animate-fade">
          {linksVisiveis.map((link) => (
            <LinkItem key={link.href} link={link} mobile />
          ))}
        </nav>
      )}
    </header>
  );
}
