import type { Metadata } from 'next';
import './globals.css';
import { ProvedorQuery } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'Plataforma Interna - Reboucas e Bulhoes Advogados',
  description: 'Sistema interno de gestao, ponto digital e produtividade.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorQuery>{children}</ProvedorQuery>
      </body>
    </html>
  );
}
