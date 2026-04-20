import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

interface RespostaPop {
  versao: string;
  texto: string;
}

export default function TelaAceitePop() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  const [pop, setPop] = useState<RespostaPop | null>(null);
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const dado = await apiClient.get<RespostaPop>('/pop/texto', token);
        setPop(dado);
      } catch (e) {
        setErro(e instanceof ApiError ? e.mensagem : 'Falha ao carregar POP.');
      }
    })();
  }, [token]);

  async function confirmar(): Promise<void> {
    setEnviando(true);
    setErro(null);
    try {
      const resp = await apiClient.post<{ versao: string }>('/auth/aceitar-pop', {}, token);
      atualizarUsuario({ aceitePopVersao: resp.versao, precisaAceitarPop: false });
      router.replace('/(tabs)/inicio');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao registrar aceite.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>POP-EST-001</Text>
        <Text style={estilos.subtitulo}>
          Leia o texto integral e registre o aceite para liberar o acesso.
        </Text>
      </View>

      <ScrollView style={estilos.scroll} contentContainerStyle={{ padding: espacamentos.lg }}>
        {erro && (
          <View style={estilos.alerta}>
            <Text style={{ color: cores.institucional.red }}>{erro}</Text>
          </View>
        )}
        {pop ? (
          <Text style={estilos.corpo}>{pop.texto}</Text>
        ) : (
          <ActivityIndicator color={cores.gold[500]} />
        )}
      </ScrollView>

      <View style={estilos.rodape}>
        <View style={estilos.linhaAceite}>
          <Switch
            value={aceite}
            onValueChange={setAceite}
            trackColor={{ false: cores.gray[100], true: cores.gold[500] }}
            thumbColor={cores.branco}
          />
          <Text style={estilos.textoAceite}>
            Declaro que li e aceito integralmente o POP-EST-001.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            estilos.botao,
            (!aceite || enviando) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
          disabled={!aceite || enviando || !pop}
          onPress={confirmar}
        >
          {enviando ? (
            <ActivityIndicator color={cores.branco} />
          ) : (
            <Text style={estilos.textoBotao}>Registrar aceite</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  cabecalho: {
    backgroundColor: cores.navy[900],
    padding: espacamentos.lg,
    borderBottomWidth: 2,
    borderBottomColor: cores.gold[500],
  },
  titulo: {
    color: cores.branco,
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo,
  },
  subtitulo: {
    color: cores.gold[300],
    fontSize: tipografia.tamanhos.pequeno,
    marginTop: espacamentos.xs,
  },
  scroll: { flex: 1, backgroundColor: cores.branco },
  corpo: {
    fontSize: tipografia.tamanhos.pequeno + 1,
    color: cores.gray[900],
    lineHeight: 22,
  },
  alerta: {
    borderWidth: 1,
    borderColor: cores.institucional.red,
    backgroundColor: '#FDECEA',
    padding: espacamentos.md,
    borderRadius: raios.sm,
    marginBottom: espacamentos.md,
  },
  rodape: {
    padding: espacamentos.lg,
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.gray[100],
    gap: espacamentos.md,
  },
  linhaAceite: { flexDirection: 'row', alignItems: 'center', gap: espacamentos.md },
  textoAceite: { flex: 1, fontSize: tipografia.tamanhos.pequeno + 1, color: cores.gray[900] },
  botao: {
    backgroundColor: cores.navy[900],
    padding: espacamentos.md,
    borderRadius: raios.sm,
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tipografia.tamanhos.pequeno,
  },
});
