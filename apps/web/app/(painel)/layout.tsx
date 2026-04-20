'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Cabecalho } from '@/components/shared/cabecalho';
import { useAuthStore } from '@/stores/auth-store';

export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const usuario = useAuthStore((s) => s.usuario);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || !usuario) {
      router.replace('/');
      return;
    }
    if (usuario.precisaAceitarPop && pathname !== '/aceite-pop') {
      router.replace('/aceite-pop');
    }
  }, [accessToken, usuario, pathname, router]);

  if (!accessToken || !usuario) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
      <footer className="bg-navy-900 text-cream/70 py-4 text-center text-xs tracking-wider">
        Reboucas &amp; Bulhoes Advogados Associados | Plataforma Interna 1.0
      </footer>
    </div>
  );
}
