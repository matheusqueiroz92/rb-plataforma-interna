import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DemandaDTO, RespostaLista } from '@rb/types';
import { ROTULOS_PRIORIDADE, ROTULOS_STATUS_DEMANDA, formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

const COR_STATUS: Record<string, string> = {
  PENDENTE: cores.gray[500],
  ANDAMENTO: cores.institucional.blue,
  ENTREGUE: cores.institucional.amber,
  EM_CORRECAO: cores.institucional.red,
  CONCLUIDA: cores.institucional.green,
  VENCIDA: cores.institucional.red,
};

export default function TelaDemandas() {
  const token = useAuthStore((s) => s.accessToken);
  const [dados, setDados] = useState<DemandaDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get<RespostaLista<DemandaDTO>>('/demandas/minhas', token);
        setDados(resp.dados);
      } catch (e) {
        if (e instanceof ApiError) setErro(e.mensagem);
      }
    })();
  }, [token]);

  if (!dados) {
    return (
      <View style={estilos.centro}>
        {erro ? (
          <Text style={{ color: cores.institucional.red }}>{erro}</Text>
        ) : (
          <ActivityIndicator color={cores.gold[500]} />
        )}
      </View>
    );
  }

  if (dados.length === 0) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.vazio}>Nenhuma demanda atribuida no momento.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={{ padding: espacamentos.lg }}>
      {dados.map((d) => (
        <View key={d.id} style={estilos.cartao}>
          <View style={estilos.linhaBadges}>
            <View style={[estilos.badge, { backgroundColor: (COR_STATUS[d.status] ?? cores.gray[500]) + '22' }]}>
              <Text style={[estilos.badgeTexto, { color: COR_STATUS[d.status] ?? cores.gray[500] }]}>
                {ROTULOS_STATUS_DEMANDA[d.status]}
              </Text>
            </View>
            <View style={[estilos.badge, { backgroundColor: cores.gray[100] }]}>
              <Text style={[estilos.badgeTexto, { color: cores.navy[900] }]}>
                {ROTULOS_PRIORIDADE[d.prioridade]}
              </Text>
            </View>
          </View>

          <Text style={estilos.titulo}>{d.titulo}</Text>
          <Text style={estilos.descricao} numberOfLines={3}>
            {d.descricao}
          </Text>

          <View style={estilos.rodape}>
            {d.prazoFatal && (
              <Text style={estilos.meta}>Prazo: {formatarDataBR(d.prazoFatal)}</Text>
            )}
            {d.clienteVinculado && (
              <Text style={estilos.meta}>Cliente: {d.clienteVinculado}</Text>
            )}
            {d.notaCorrecao !== null && (
              <Text style={[estilos.meta, { color: cores.institucional.green }]}>
                Nota {d.notaCorrecao}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xl,
    backgroundColor: cores.cream,
  },
  vazio: { color: cores.gray[500], textAlign: 'center' },
  cartao: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    marginBottom: espacamentos.md,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
  },
  linhaBadges: { flexDirection: 'row', gap: espacamentos.sm, marginBottom: espacamentos.sm },
  badge: { paddingHorizontal: espacamentos.sm + 2, paddingVertical: 4, borderRadius: raios.sm },
  badgeTexto: {
    fontSize: tipografia.tamanhos.capsula,
    fontWeight: tipografia.pesos.semi,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titulo: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo - 2,
    color: cores.navy[900],
  },
  descricao: {
    color: cores.gray[900],
    marginTop: espacamentos.xs,
    fontSize: tipografia.tamanhos.pequeno + 1,
  },
  rodape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamentos.md,
    marginTop: espacamentos.md,
    borderTopWidth: 1,
    borderTopColor: cores.gray[100],
    paddingTop: espacamentos.sm,
  },
  meta: { fontSize: tipografia.tamanhos.capsula + 1, color: cores.gray[500] },
});
