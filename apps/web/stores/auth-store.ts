'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioSessao } from '@rb/types';

interface AuthState {
  usuario: UsuarioSessao | null;
  accessToken: string | null;
  refreshToken: string | null;
  definirSessao: (dados: {
    accessToken: string;
    refreshToken: string;
    usuario: UsuarioSessao;
  }) => void;
  atualizarUsuario: (parcial: Partial<UsuarioSessao>) => void;
  limpar: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      definirSessao: (dados) =>
        set({
          accessToken: dados.accessToken,
          refreshToken: dados.refreshToken,
          usuario: dados.usuario,
        }),
      atualizarUsuario: (parcial) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...parcial } : null,
        })),
      limpar: () => set({ usuario: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'rb-sessao' },
  ),
);
