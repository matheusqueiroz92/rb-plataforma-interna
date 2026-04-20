import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UsuarioSessao } from '@rb/types';

const storageNativo = {
  getItem: async (chave: string) => SecureStore.getItemAsync(chave),
  setItem: async (chave: string, valor: string) => SecureStore.setItemAsync(chave, valor),
  removeItem: async (chave: string) => SecureStore.deleteItemAsync(chave),
};

const storage = createJSONStorage(() => (Platform.OS === 'web' ? AsyncStorage : storageNativo));

interface AuthState {
  usuario: UsuarioSessao | null;
  accessToken: string | null;
  refreshToken: string | null;
  hidratado: boolean;
  definirSessao: (dados: {
    accessToken: string;
    refreshToken: string;
    usuario: UsuarioSessao;
  }) => void;
  atualizarUsuario: (parcial: Partial<UsuarioSessao>) => void;
  limpar: () => void;
  marcarHidratado: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      hidratado: false,
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
      marcarHidratado: () => set({ hidratado: true }),
    }),
    {
      name: 'rb-sessao',
      storage,
      onRehydrateStorage: () => (state) => {
        state?.marcarHidratado();
      },
    },
  ),
);
