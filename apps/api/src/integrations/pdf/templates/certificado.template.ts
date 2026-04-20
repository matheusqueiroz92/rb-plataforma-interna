export interface DadosCertificado {
  nomeColaborador: string;
  tipoCertificado: string;
  periodoReferencia: string;
  pontuacaoObtida: number;
  posicaoFinal: number | null;
  numeroSequencial: string;
  emitidoEm: string;
}

const ESTILOS = `
  * { box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  body {
    margin: 0;
    font-family: 'Georgia', 'Cormorant Garamond', serif;
    color: #0D1A2B;
    background: #FAF8F3;
    width: 297mm;
    height: 210mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .moldura {
    border: 8px solid #C9A84C;
    padding: 40px 60px;
    width: 85%;
    height: 85%;
    text-align: center;
    position: relative;
    background: #FFFFFF;
    box-shadow: 0 0 0 2px #F5E6B0 inset;
  }
  .monograma {
    font-family: 'Georgia', serif;
    font-size: 48px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: #C9A84C;
  }
  .escritorio {
    font-size: 18px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #192F4A;
    margin-top: 6px;
  }
  .filete {
    height: 2px;
    width: 60%;
    margin: 30px auto;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .titulo {
    font-size: 42px;
    font-weight: 500;
    margin: 20px 0 40px;
    letter-spacing: 0.05em;
  }
  .corpo {
    font-size: 20px;
    line-height: 1.8;
    color: #1C1814;
  }
  .destaque {
    font-family: 'Georgia', serif;
    font-weight: 700;
    font-size: 32px;
    color: #0D1A2B;
    margin: 10px 0;
  }
  .pontos {
    font-family: 'Courier New', monospace;
    font-size: 60px;
    color: #C9A84C;
    margin: 20px 0 5px;
  }
  .rodape {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 40px;
    font-size: 11px;
    color: #8A8270;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }
  .numero {
    font-family: 'Courier New', monospace;
  }
`;

export function renderizarCertificadoHtml(d: DadosCertificado): string {
  const tituloHumano =
    d.tipoCertificado === 'SEMANAL'
      ? 'Certificado de Destaque Semanal'
      : d.tipoCertificado === 'MENSAL'
        ? 'Certificado de Destaque Mensal'
        : d.tipoCertificado === 'ANUAL'
          ? 'Certificado de Destaque Anual'
          : 'Certificado de Destaque';

  const posicaoTexto = d.posicaoFinal
    ? `ocupando a <strong>${d.posicaoFinal}&ordf; posicao</strong> no ranking`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${tituloHumano}</title>
<style>${ESTILOS}</style>
</head>
<body>
  <div class="moldura">
    <div class="monograma">R B</div>
    <div class="escritorio">Reboucas e Bulhoes Advogados Associados</div>

    <div class="filete"></div>

    <div class="titulo">${tituloHumano}</div>

    <div class="corpo">
      Conferimos a
      <div class="destaque">${d.nomeColaborador}</div>
      o presente certificado pelo desempenho excepcional no periodo
      <strong>${d.periodoReferencia}</strong>, ${posicaoTexto}.
    </div>

    <div class="pontos">${d.pontuacaoObtida}</div>
    <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8A8270">pontos obtidos</div>

    <div class="rodape">
      <span class="numero">N&ordm; ${d.numeroSequencial}</span>
      <span>Emitido em ${d.emitidoEm}</span>
      <span>Dr. Ricardo Bulhoes / OAB/BA 30.336</span>
    </div>
  </div>
</body>
</html>`;
}
