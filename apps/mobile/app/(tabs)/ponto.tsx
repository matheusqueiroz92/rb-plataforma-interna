import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EstadoPontoHoje } from '@rb/types';
import type { RegimePonto, TipoPonto } from '@rb/constants';
import { ROTULOS_TIPO_PONTO, formatarHoraBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';
import { CapturaFoto } from '@/components/CapturaFoto';

const TIPOS_ORDEM: TipoPonto[] = ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL'];

export default function TelaPonto() {
  const token = useAuthStore((s) => s.accessToken);
  const [estado, setEstado] = useState<EstadoPontoHoje | null>(null);
  const [regime, setRegime] = useState<RegimePonto>('PRESENCIAL');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function recarregar(): Promise<void> {
    try {
      const d = await apiClient.get<EstadoPontoHoje>('/ponto/hoje', token);
      setEstado(d);
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    }
  }

  useEffect(() => {
    if (token) void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function registrar(): Promise<void> {
    if (!foto || !estado?.proximoEsperado) return;
    setEnviando(true);
    setMensagem(null);
    try {
      await apiClient.post(
        '/ponto/registrar',
        {
          tipo: estado.proximoEsperado,
          regime,
          fotoBase64: foto,
          timestampCliente: new Date().toISOString(),
          dispositivo: 'mobile',
        },
        token,
      );
      setFoto(null);
      await recarregar();
      setMensagem({ tipo: 'ok', texto: 'Ponto registrado.' });
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    } finally {
      setEnviando(false);
    }
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
              borderColor: mensagem.tipo === 'ok' ? cores.institucional.green : cores.institucional.red,
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
        <Text style={estilos.tituloCartao}>Registros de hoje</Text>
        {TIPOS_ORDEM.map((tipo) => {
          const registro = estado?.pontos.find((p) => p.tipo === tipo);
          return (
            <View key={tipo} style={estilos.linhaRegistro}>
              <View>
                <Text style={estilos.registroNome}>{ROTULOS_TIPO_PONTO[tipo]}</Text>
                <Text style={estilos.registroMeta}>
                  {registro
                    ? registro.regime === 'PRESENCIAL'
                      ? 'Presencial'
                      : 'Home office'
                    : 'Aguardando'}
                </Text>
              </View>
              {registro ? (
                <View style={[estilos.chip, { backgroundColor: cores.institucional.green + '22' }]}>
                  <Text style={{ color: cores.institucional.green, fontFamily: 'monospace' }}>
                    {formatarHoraBR(registro.timestampServidor)}
                  </Text>
                </View>
              ) : estado?.proximoEsperado === tipo ? (
                <View style={[estilos.chip, { backgroundColor: cores.institucional.amber + '22' }]}>
                  <Text style={{ color: cores.institucional.amber }}>Proximo</Text>
                </View>
              ) : (
                <View style={[estilos.chip, { backgroundColor: cores.gray[100] }]}>
                  <Text style={{ color: cores.gray[500] }}>Pendente</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {estado?.concluido ? (
        <View style={[estilos.cartao, { alignItems: 'center' }]}>
          <Text style={estilos.tituloCartao}>Jornada concluida</Text>
          <Text style={estilos.registroMeta}>Todos os pontos do dia foram registrados.</Text>
        </View>
      ) : estado?.proximoEsperado ? (
        <View style={estilos.cartao}>
          <Text style={estilos.tituloCartao}>
            Registrar: {ROTULOS_TIPO_PONTO[estado.proximoEsperado]}
          </Text>
          {estado.proximoEsperado === 'SAIDA_FINAL' && (
            <View style={[estilos.alerta, { backgroundColor: cores.institucional.amber + '22', borderColor: cores.institucional.amber, marginBottom: espacamentos.md }]}>
              <Text style={{ color: cores.institucional.amber }}>
                Envie o relatorio diario antes de registrar a saida final.
              </Text>
            </View>
          )}

          <View style={estilos.seletorRegime}>
            {(['PRESENCIAL', 'HOME_OFFICE'] as RegimePonto[]).map((r) => (
              <Pressable
                key={r}
                style={[
                  estilos.opcaoRegime,
                  regime === r && { borderColor: cores.gold[500], backgroundColor: cores.gold[300] + '55' },
                ]}
                onPress={() => setRegime(r)}
              >
                <Text
                  style={[
                    estilos.opcaoRegimeTexto,
                    regime === r && { color: cores.navy[900], fontWeight: '600' },
                  ]}
                >
                  {r === 'PRESENCIAL' ? 'Presencial' : 'Home office'}
                </Text>
              </Pressable>
            ))}
          </View>

          <CapturaFoto onCaptura={(d) => setFoto(d || null)} fotoAtual={foto} />

          <Pressable
            style={({ pressed }) => [
              estilos.botaoConfirma,
              (!foto || enviando) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
            disabled={!foto || enviando}
            onPress={() => void registrar()}
          >
            {enviando ? (
              <ActivityIndicator color={cores.branco} />
            ) : (
              <Text style={estilos.textoBotao}>Confirmar registro</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={[estilos.cartao, { alignItems: 'center' }]}>
          <ActivityIndicator color={cores.gold[500]} />
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  cartao: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    marginBottom: espacamentos.md,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
    gap: espacamentos.sm,
  },
  tituloCartao: {
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo,
    color: cores.navy[900],
    marginBottom: espacamentos.sm,
  },
  alerta: {
    padding: espacamentos.md,
    borderRadius: raios.sm,
    borderWidth: 1,
    marginBottom: espacamentos.md,
  },
  linhaRegistro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: espacamentos.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.gray[100],
  },
  registroNome: { fontSize: tipografia.tamanhos.corpo, color: cores.navy[900], fontWeight: '600' },
  registroMeta: { fontSize: tipografia.tamanhos.capsula + 1, color: cores.gray[500], marginTop: 2 },
  chip: { paddingHorizontal: espacamentos.md, paddingVertical: 4, borderRadius: raios.sm },
  seletorRegime: { flexDirection: 'row', gap: espacamentos.sm, marginVertical: espacamentos.md },
  opcaoRegime: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.gray[100],
    borderRadius: raios.sm,
    padding: espacamentos.md,
    alignItems: 'center',
  },
  opcaoRegimeTexto: { color: cores.gray[500], fontSize: tipografia.tamanhos.pequeno + 1 },
  botaoConfirma: {
    backgroundColor: cores.navy[900],
    padding: espacamentos.md,
    borderRadius: raios.sm,
    alignItems: 'center',
    marginTop: espacamentos.md,
  },
  textoBotao: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tipografia.tamanhos.pequeno,
  },
});
