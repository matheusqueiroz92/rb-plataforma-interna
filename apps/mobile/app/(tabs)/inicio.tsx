import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { ROTULOS_PERFIL } from '@rb/utils';

import { useAuthStore } from '@/lib/auth-store';
import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

export default function TelaInicio() {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const limpar = useAuthStore((s) => s.limpar);

  function sair(): void {
    limpar();
    router.replace('/(auth)/login');
  }

  if (!usuario) return null;

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={{ padding: espacamentos.lg }}>
      <View style={estilos.cartaoHero}>
        <Text style={estilos.saudacao}>Bem-vinda, {usuario.nome.split(' ')[0]}.</Text>
        <Text style={estilos.meta}>
          {ROTULOS_PERFIL[usuario.perfil]} &middot; {usuario.matricula}
        </Text>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.tituloCartao}>Conformidade ativa</Text>
        <View style={estilos.listaBadges}>
          <View style={[estilos.badge, { backgroundColor: cores.institucional.green + '22' }]}>
            <Text style={[estilos.badgeTexto, { color: cores.institucional.green }]}>
              Lei 11.788
            </Text>
          </View>
          <View style={[estilos.badge, { backgroundColor: cores.institucional.green + '22' }]}>
            <Text style={[estilos.badgeTexto, { color: cores.institucional.green }]}>LGPD</Text>
          </View>
          <View style={[estilos.badge, { backgroundColor: cores.institucional.green + '22' }]}>
            <Text style={[estilos.badgeTexto, { color: cores.institucional.green }]}>OAB</Text>
          </View>
        </View>
        <Text style={estilos.texto}>
          Os registros desta plataforma servem como evidencia formal da rotina de trabalho, da
          jornada e do cumprimento dos procedimentos internos.
        </Text>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.tituloCartao}>Fluxo do dia</Text>
        <Text style={estilos.texto}>
          1. Registre o ponto de entrada na aba Ponto.{'\n'}
          2. Siga a rotina e marque o checklist.{'\n'}
          3. Envie o relatorio diario antes do encerramento.{'\n'}
          4. Registre a saida final.
        </Text>
      </View>

      <Pressable style={({ pressed }) => [estilos.botaoSair, pressed && { opacity: 0.85 }]} onPress={sair}>
        <LogOut size={18} color={cores.branco} />
        <Text style={estilos.textoBotaoSair}>Encerrar sessao</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  cartaoHero: {
    backgroundColor: cores.navy[900],
    padding: espacamentos.lg,
    borderRadius: raios.lg,
    marginBottom: espacamentos.lg,
    borderTopWidth: 3,
    borderTopColor: cores.gold[500],
  },
  saudacao: {
    color: cores.cream,
    fontFamily: tipografia.serif,
    fontSize: tipografia.tamanhos.subtitulo + 2,
  },
  meta: {
    color: cores.gold[300],
    marginTop: espacamentos.xs,
    fontSize: tipografia.tamanhos.pequeno,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
    fontSize: tipografia.tamanhos.subtitulo,
    color: cores.navy[900],
    marginBottom: espacamentos.sm,
  },
  texto: {
    fontSize: tipografia.tamanhos.pequeno + 1,
    color: cores.gray[900],
    lineHeight: 20,
  },
  listaBadges: {
    flexDirection: 'row',
    gap: espacamentos.sm,
    marginBottom: espacamentos.md,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: espacamentos.sm + 2,
    paddingVertical: 4,
    borderRadius: raios.sm,
  },
  badgeTexto: {
    fontSize: tipografia.tamanhos.capsula,
    fontWeight: tipografia.pesos.semi,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  botaoSair: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacamentos.sm,
    backgroundColor: cores.institucional.red,
    padding: espacamentos.md,
    borderRadius: raios.sm,
    marginTop: espacamentos.md,
  },
  textoBotaoSair: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tipografia.tamanhos.pequeno,
  },
});
