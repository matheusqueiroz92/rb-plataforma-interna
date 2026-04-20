import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, RefreshCw } from 'lucide-react-native';

import { cores, espacamentos, raios, tipografia } from '@/lib/theme';

interface Props {
  onCaptura: (dataUrl: string) => void;
  fotoAtual?: string | null;
}

export function CapturaFoto({ onCaptura, fotoAtual }: Props) {
  const [permissao, solicitar] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [capturando, setCapturando] = useState(false);

  useEffect(() => {
    if (permissao && !permissao.granted && permissao.canAskAgain) {
      solicitar().catch(() => {});
    }
  }, [permissao, solicitar]);

  async function capturar(): Promise<void> {
    if (!cameraRef.current) return;
    setCapturando(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        base64: true,
        skipProcessing: true,
      });
      if (foto?.base64) {
        onCaptura(`data:image/jpeg;base64,${foto.base64}`);
      }
    } finally {
      setCapturando(false);
    }
  }

  if (!permissao) {
    return (
      <View style={estilos.contornoVideo}>
        <ActivityIndicator color={cores.gold[500]} />
      </View>
    );
  }

  if (!permissao.granted) {
    return (
      <View style={estilos.avisoPermissao}>
        <Text style={estilos.textoAviso}>
          Permissao de camera obrigatoria para registrar o ponto.
        </Text>
        <Pressable style={estilos.botao} onPress={() => void solicitar()}>
          <Text style={estilos.textoBotao}>Solicitar permissao</Text>
        </Pressable>
      </View>
    );
  }

  if (fotoAtual) {
    return (
      <View style={{ gap: espacamentos.sm }}>
        <View style={estilos.molduraFoto}>
          <Image source={{ uri: fotoAtual }} style={estilos.previa} />
          <View style={estilos.selo}>
            <Text style={estilos.seloTexto}>Foto registrada</Text>
          </View>
        </View>
        <Pressable
          style={[estilos.botao, { backgroundColor: 'transparent', borderWidth: 1, borderColor: cores.navy[900] }]}
          onPress={() => onCaptura('')}
        >
          <RefreshCw size={16} color={cores.navy[900]} />
          <Text style={[estilos.textoBotao, { color: cores.navy[900] }]}>Capturar nova foto</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: espacamentos.sm }}>
      <View style={estilos.contornoVideo}>
        <CameraView ref={(r) => { cameraRef.current = r; }} style={estilos.camera} facing="front" />
      </View>
      <Pressable
        style={[estilos.botao, { backgroundColor: cores.gold[500] }, capturando && { opacity: 0.7 }]}
        disabled={capturando}
        onPress={() => void capturar()}
      >
        <Camera size={18} color={cores.navy[900]} />
        <Text style={[estilos.textoBotao, { color: cores.navy[900] }]}>
          {capturando ? 'Capturando...' : 'Capturar foto e confirmar'}
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contornoVideo: {
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
    borderRadius: raios.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: { flex: 1, width: '100%' },
  avisoPermissao: {
    padding: espacamentos.lg,
    backgroundColor: cores.branco,
    borderRadius: raios.md,
    borderWidth: 1,
    borderColor: cores.gold[500],
    gap: espacamentos.md,
    alignItems: 'center',
  },
  textoAviso: { fontSize: tipografia.tamanhos.pequeno + 1, color: cores.gray[900], textAlign: 'center' },
  molduraFoto: {
    position: 'relative',
    borderRadius: raios.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.gold[500],
  },
  previa: { width: '100%', aspectRatio: 4 / 3 },
  selo: {
    position: 'absolute',
    top: espacamentos.sm,
    right: espacamentos.sm,
    backgroundColor: cores.institucional.green,
    paddingHorizontal: espacamentos.sm,
    paddingVertical: 4,
    borderRadius: raios.sm,
  },
  seloTexto: {
    color: cores.branco,
    fontSize: tipografia.tamanhos.capsula,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  botao: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacamentos.sm,
    backgroundColor: cores.navy[900],
    padding: espacamentos.md,
    borderRadius: raios.sm,
  },
  textoBotao: {
    color: cores.branco,
    fontWeight: tipografia.pesos.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tipografia.tamanhos.pequeno,
  },
});
