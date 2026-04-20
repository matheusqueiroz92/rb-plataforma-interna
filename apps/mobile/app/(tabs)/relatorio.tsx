import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RELATORIO_MIN_CARACTERES } from '@rb/constants';
import { formatarDataHoraBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

interface RelatorioExistente {
  id: string;
  enviadoEm: string;
  pergunta1Atividades: string;
  pergunta2Dificuldades: string;
  pergunta3DemandaConcluida: boolean;
  pergunta3Justificativa: string | null;
}

export default function TelaRelatorio() {
  const token = useAuthStore((s) => s.accessToken);
  const [existente, setExistente] = useState<RelatorioExistente | null>(null);
  const [atividades, setAtividades] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [concluiu, setConcluiu] = useState(true);
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function carregar(): Promise<void> {
    try {
      const dado = await apiClient.get<RelatorioExistente | null>('/relatorios/hoje', token);
      setExistente(dado);
    } catch {
      setExistente(null);
    }
  }

  useEffect(() => {
    if (token) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function enviar(): Promise<void> {
    if (atividades.length < RELATORIO_MIN_CARACTERES.atividades) {
      setMensagem({ tipo: 'erro', texto: `Atividades: minimo ${RELATORIO_MIN_CARACTERES.atividades} caracteres.` });
      return;
    }
    if (dificuldades.length < RELATORIO_MIN_CARACTERES.dificuldades) {
      setMensagem({ tipo: 'erro', texto: `Dificuldades: minimo ${RELATORIO_MIN_CARACTERES.dificuldades} caracteres.` });
      return;
    }
    if (!concluiu && justificativa.length < RELATORIO_MIN_CARACTERES.justificativa) {
      setMensagem({ tipo: 'erro', texto: `Justificativa: minimo ${RELATORIO_MIN_CARACTERES.justificativa} caracteres.` });
      return;
    }

    setEnviando(true);
    setMensagem(null);
    try {
      await apiClient.post(
        '/relatorios/enviar',
        {
          pergunta1Atividades: atividades,
          pergunta2Dificuldades: dificuldades,
          pergunta3DemandaConcluida: concluiu,
          pergunta3Justificativa: concluiu ? undefined : justificativa,
        },
        token,
      );
      setMensagem({ tipo: 'ok', texto: 'Relatorio enviado.' });
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    } finally {
      setEnviando(false);
    }
  }

  if (existente) {
    return (
      <ScrollView style={estilos.tela} contentContainerStyle={{ padding: espacamentos.lg }}>
        <View style={estilos.cartao}>
          <Text style={estilos.tituloCartao}>Relatorio enviado</Text>
          <Text style={estilos.meta}>{formatarDataHoraBR(existente.enviadoEm)}</Text>

          <Text style={estilos.label}>Atividades</Text>
          <Text style={estilos.textoConteudo}>{existente.pergunta1Atividades}</Text>

          <Text style={estilos.label}>Dificuldades</Text>
          <Text style={estilos.textoConteudo}>{existente.pergunta2Dificuldades}</Text>

          <Text style={estilos.label}>Concluiu a demanda</Text>
          <Text style={estilos.textoConteudo}>
            {existente.pergunta3DemandaConcluida ? 'Sim' : 'Nao'}
            {existente.pergunta3Justificativa && `\n${existente.pergunta3Justificativa}`}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={{ padding: espacamentos.lg }}>
      {mensagem && (
        <View
          style={[
            estilos.alerta,
            {
              backgroundColor:
                mensagem.tipo === 'ok' ? cores.institucional.green + '22' : '#FDECEA',
              borderColor:
                mensagem.tipo === 'ok' ? cores.institucional.green : cores.institucional.red,
            },
          ]}
        >
          <Text
            style={{
              color: mensagem.tipo === 'ok' ? cores.institucional.green : cores.institucional.red,
            }}
          >
            {mensagem.texto}
          </Text>
        </View>
      )}

      <View style={estilos.cartao}>
        <Text style={estilos.tituloCartao}>Relatorio do dia</Text>

        <Text style={estilos.label}>Atividades realizadas (min. {RELATORIO_MIN_CARACTERES.atividades})</Text>
        <TextInput
          style={estilos.textarea}
          multiline
          placeholder="Descreva as atividades..."
          placeholderTextColor={cores.gray[500]}
          value={atividades}
          onChangeText={setAtividades}
        />

        <Text style={estilos.label}>Onde teve dificuldade (min. {RELATORIO_MIN_CARACTERES.dificuldades})</Text>
        <TextInput
          style={estilos.textarea}
          multiline
          placeholder="Pontos em que precisou de apoio..."
          placeholderTextColor={cores.gray[500]}
          value={dificuldades}
          onChangeText={setDificuldades}
        />

        <Text style={estilos.label}>Terminou a demanda atribuida?</Text>
        <View style={{ flexDirection: 'row', gap: espacamentos.sm, marginTop: espacamentos.xs }}>
          {[
            { valor: true, rotulo: 'Sim' },
            { valor: false, rotulo: 'Nao' },
          ].map((o) => (
            <Pressable
              key={o.rotulo}
              style={[
                estilos.opcaoRadio,
                concluiu === o.valor && {
                  borderColor: cores.gold[500],
                  backgroundColor: cores.gold[300] + '55',
                },
              ]}
              onPress={() => setConcluiu(o.valor)}
            >
              <Text
                style={{
                  color: concluiu === o.valor ? cores.navy[900] : cores.gray[500],
                  fontWeight: concluiu === o.valor ? '600' : '400',
                }}
              >
                {o.rotulo}
              </Text>
            </Pressable>
          ))}
        </View>

        {!concluiu && (
          <>
            <Text style={estilos.label}>Justificativa (min. {RELATORIO_MIN_CARACTERES.justificativa})</Text>
            <TextInput
              style={estilos.textarea}
              multiline
              placeholder="Explique o motivo..."
              placeholderTextColor={cores.gray[500]}
              value={justificativa}
              onChangeText={setJustificativa}
            />
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            estilos.botao,
            enviando && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
          disabled={enviando}
          onPress={() => void enviar()}
        >
          {enviando ? (
            <ActivityIndicator color={cores.branco} />
          ) : (
            <Text style={estilos.textoBotao}>Enviar relatorio diario</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  cartao: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
    gap: espacamentos.sm,
  },
  tituloCartao: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo,
    color: cores.navy[900],
  },
  meta: { fontSize: tipografia.tamanhos.pequeno, color: cores.gray[500], marginBottom: espacamentos.md },
  label: {
    fontSize: tipografia.tamanhos.pequeno,
    fontWeight: tipografia.pesos.semi,
    color: cores.navy[900],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: espacamentos.md,
  },
  textoConteudo: { fontSize: tipografia.tamanhos.pequeno + 1, color: cores.gray[900], lineHeight: 20 },
  textarea: {
    borderWidth: 1,
    borderColor: cores.gray[100],
    borderRadius: raios.sm,
    padding: espacamentos.md,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: tipografia.tamanhos.pequeno + 1,
    color: cores.gray[900],
    backgroundColor: cores.branco,
  },
  opcaoRadio: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.gray[100],
    borderRadius: raios.sm,
    padding: espacamentos.md,
    alignItems: 'center',
  },
  botao: {
    backgroundColor: cores.navy[900],
    padding: espacamentos.md,
    borderRadius: raios.sm,
    alignItems: 'center',
    marginTop: espacamentos.lg,
  },
  textoBotao: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tipografia.tamanhos.pequeno,
  },
  alerta: {
    padding: espacamentos.md,
    borderRadius: raios.sm,
    borderWidth: 1,
    marginBottom: espacamentos.md,
  },
});
