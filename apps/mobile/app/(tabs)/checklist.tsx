import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import type { ChecklistProgresso } from '@rb/types';
import type { CategoriaChecklist } from '@rb/constants';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

const TITULOS: Record<CategoriaChecklist, string> = {
  S1_SEIRI: '1S Seiri (descarte)',
  S2_SEITON: '2S Seiton (ordenacao)',
  S3_SEISO: '3S Seiso (limpeza)',
  S4_SEIKETSU: '4S Seiketsu (padronizacao)',
  S5_SHITSUKE: '5S Shitsuke (disciplina)',
  ROTINA_INICIO: 'Rotina de inicio',
  ROTINA_JURIDICA: 'Rotina juridica',
  ROTINA_ADMIN: 'Rotina administrativa',
  ENCERRAMENTO: 'Encerramento',
};

export default function TelaChecklist() {
  const token = useAuthStore((s) => s.accessToken);
  const [progresso, setProgresso] = useState<ChecklistProgresso | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    try {
      const d = await apiClient.get<ChecklistProgresso>('/checklist/progresso-hoje', token);
      setProgresso(d);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function alternar(itemId: string, concluido: boolean): Promise<void> {
    setAtualizando(itemId);
    try {
      await apiClient.post('/checklist/responder', { itemId, concluido: !concluido }, token);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    } finally {
      setAtualizando(null);
    }
  }

  if (!progresso) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.gold[500]} />
      </View>
    );
  }

  const categorias = Array.from(
    progresso.itens.reduce<Map<CategoriaChecklist, ChecklistProgresso['itens']>>((acc, item) => {
      const arr = acc.get(item.categoria) ?? [];
      arr.push(item);
      acc.set(item.categoria, arr);
      return acc;
    }, new Map()),
  );

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={{ padding: espacamentos.lg }}>
      {erro && (
        <View style={estilos.alerta}>
          <Text style={{ color: cores.institucional.red }}>{erro}</Text>
        </View>
      )}

      <View style={estilos.cabecalhoProgresso}>
        <View>
          <Text style={estilos.progressoMeta}>Hoje</Text>
          <Text style={estilos.progressoContador}>
            {progresso.totalConcluido} de {progresso.totalItens}
          </Text>
        </View>
        <View style={estilos.barra}>
          <View style={[estilos.preenchimento, { width: `${progresso.percentual}%` }]} />
        </View>
        <Text style={estilos.percentual}>{progresso.percentual}%</Text>
      </View>

      {categorias.map(([categoria, itens]) => (
        <View key={categoria} style={estilos.cartao}>
          <Text style={estilos.tituloCartao}>{TITULOS[categoria]}</Text>
          {itens.map((item) => {
            const desabilitado = atualizando === item.id;
            return (
              <Pressable
                key={item.id}
                disabled={desabilitado}
                onPress={() => void alternar(item.id, item.concluido)}
                style={[
                  estilos.itemLinha,
                  item.concluido && { backgroundColor: cores.institucional.green + '14' },
                ]}
              >
                {item.concluido ? (
                  <CheckSquare size={20} color={cores.institucional.green} />
                ) : (
                  <Square size={20} color={cores.gray[500]} />
                )}
                <Text
                  style={[
                    estilos.itemTexto,
                    item.concluido && {
                      color: cores.gray[500],
                      textDecorationLine: 'line-through',
                    },
                  ]}
                >
                  {item.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.cream },
  cabecalhoProgresso: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    marginBottom: espacamentos.md,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
  },
  progressoMeta: {
    fontSize: tipografia.tamanhos.capsula,
    color: cores.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  progressoContador: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.titulo,
    color: cores.navy[900],
  },
  barra: {
    height: 6,
    backgroundColor: cores.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: espacamentos.md,
  },
  preenchimento: { height: '100%', backgroundColor: cores.gold[500] },
  percentual: {
    textAlign: 'right',
    color: cores.gray[500],
    fontSize: tipografia.tamanhos.capsula,
    marginTop: 4,
  },
  cartao: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    marginBottom: espacamentos.md,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
  },
  tituloCartao: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo - 2,
    color: cores.navy[900],
    marginBottom: espacamentos.sm,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacamentos.sm,
    padding: espacamentos.md,
    borderRadius: raios.sm,
    marginBottom: 4,
  },
  itemTexto: { flex: 1, color: cores.gray[900], fontSize: tipografia.tamanhos.pequeno + 1 },
  alerta: {
    padding: espacamentos.md,
    borderRadius: raios.sm,
    borderWidth: 1,
    borderColor: cores.institucional.red,
    backgroundColor: '#FDECEA',
    marginBottom: espacamentos.md,
  },
});
