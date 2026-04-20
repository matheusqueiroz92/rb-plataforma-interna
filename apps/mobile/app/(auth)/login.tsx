import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { RespostaLogin } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

export default function TelaLogin() {
  const router = useRouter();
  const definirSessao = useAuthStore((s) => s.definirSessao);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(): Promise<void> {
    if (!email || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const resp = await apiClient.post<RespostaLogin>('/auth/login', { email, senha });
      definirSessao(resp);
      router.replace(resp.usuario.precisaAceitarPop ? '/(auth)/aceite-pop' : '/(tabs)/inicio');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao autenticar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={estilos.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.cartao}>
            <View style={estilos.cabecalho}>
              <Text style={estilos.monograma}>R B</Text>
              <Text style={estilos.titulo}>Reboucas e Bulhoes</Text>
              <Text style={estilos.subtitulo}>Advogados Associados</Text>
              <View style={estilos.filete} />
              <Text style={estilos.marca}>Plataforma Interna</Text>
            </View>

            <View style={{ gap: espacamentos.md }}>
              <View>
                <Text style={estilos.label}>E-mail institucional</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  style={estilos.input}
                  placeholder="nome@reboucasebulhoes.com.br"
                  placeholderTextColor={cores.gray[500]}
                />
              </View>
              <View>
                <Text style={estilos.label}>Senha</Text>
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  textContentType="password"
                  style={estilos.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor={cores.gray[500]}
                />
              </View>

              {erro && (
                <View style={estilos.alertaErro}>
                  <Text style={{ color: cores.institucional.red, fontSize: tipografia.tamanhos.pequeno }}>
                    {erro}
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  estilos.botaoPrimario,
                  (enviando || pressed) && { opacity: 0.85 },
                ]}
                disabled={enviando}
                onPress={entrar}
              >
                {enviando ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={estilos.textoBotao}>Acessar plataforma</Text>
                )}
              </Pressable>
            </View>

            <Text style={estilos.nota}>
              Acesso restrito. Uso exclusivo de colaboradores autorizados.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.navy[900] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: espacamentos.lg },
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: raios.lg,
    padding: espacamentos.xl,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
  },
  cabecalho: { alignItems: 'center', marginBottom: espacamentos.xl },
  monograma: {
    fontSize: 22,
    letterSpacing: 8,
    color: cores.gold[500],
    fontWeight: tipografia.pesos.bold,
  },
  titulo: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.titulo,
    color: cores.navy[900],
    marginTop: espacamentos.xs,
  },
  subtitulo: {
    fontSize: tipografia.tamanhos.capsula,
    letterSpacing: 3,
    color: cores.gray[500],
    textTransform: 'uppercase',
    marginTop: 4,
  },
  filete: {
    height: 1,
    width: '55%',
    backgroundColor: cores.gold[500],
    opacity: 0.4,
    marginVertical: espacamentos.md,
  },
  marca: {
    fontSize: tipografia.tamanhos.pequeno,
    color: cores.gray[500],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: tipografia.tamanhos.pequeno,
    fontWeight: tipografia.pesos.semi,
    color: cores.navy[900],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: espacamentos.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: cores.gray[100],
    borderRadius: raios.sm,
    paddingHorizontal: espacamentos.md,
    paddingVertical: espacamentos.sm + 2,
    fontSize: tipografia.tamanhos.corpo,
    color: cores.gray[900],
    backgroundColor: cores.branco,
  },
  alertaErro: {
    borderWidth: 1,
    borderColor: cores.institucional.red,
    backgroundColor: '#FDECEA',
    padding: espacamentos.md,
    borderRadius: raios.sm,
  },
  botaoPrimario: {
    backgroundColor: cores.navy[900],
    paddingVertical: espacamentos.md,
    borderRadius: raios.sm,
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: tipografia.tamanhos.pequeno,
  },
  nota: {
    fontSize: tipografia.tamanhos.capsula,
    color: cores.gray[500],
    textAlign: 'center',
    marginTop: espacamentos.xl,
  },
});
