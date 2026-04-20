'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CapturaFotoProps {
  onCaptura: (dataUrl: string) => void;
  fotoAtual?: string | null;
}

export function CapturaFoto({ onCaptura, fotoAtual }: CapturaFotoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);

  const iniciarCamera = useCallback(async () => {
    setErro(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (e) {
      const mensagem =
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'Permissao de camera negada. Habilite no navegador para registrar o ponto.'
          : 'Nao foi possivel acessar a camera.';
      setErro(mensagem);
    }
  }, []);

  useEffect(() => {
    void iniciarCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capturar(): void {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturando(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    onCaptura(dataUrl);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCapturando(false);
  }

  async function recapturar(): Promise<void> {
    onCaptura('');
    await iniciarCamera();
  }

  if (erro) {
    return (
      <div className="rounded-md border border-institucional-red/30 bg-institucional-red/10 p-4 text-sm text-institucional-red">
        {erro}
        <button onClick={iniciarCamera} className="ml-3 underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (fotoAtual) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-md border border-gold-500/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoAtual} alt="Foto capturada" className="w-full h-auto" />
          <span className="absolute top-2 right-2 badge badge-ok">Foto registrada</span>
        </div>
        <button type="button" onClick={recapturar} className="btn-outline">
          <RefreshCw className="h-4 w-4" /> Capturar nova foto
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-md border border-gray-100 bg-black aspect-[4/3]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <button
        type="button"
        onClick={capturar}
        disabled={!stream || capturando}
        className="btn-dourado w-full"
      >
        <Camera className="h-4 w-4" />
        {capturando ? 'Capturando...' : 'Capturar foto e confirmar ponto'}
      </button>
    </div>
  );
}
