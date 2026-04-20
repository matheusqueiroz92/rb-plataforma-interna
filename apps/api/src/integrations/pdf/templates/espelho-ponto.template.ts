export interface LinhaEspelhoPonto {
  data: string;
  entrada: string | null;
  saidaAlmoco: string | null;
  retornoAlmoco: string | null;
  saidaFinal: string | null;
  horasTrabalhadas: string;
  editado: boolean;
}

export interface DadosEspelhoPonto {
  nomeColaborador: string;
  matricula: string;
  perfil: string;
  mes: string;
  linhas: LinhaEspelhoPonto[];
  totalHoras: string;
  assinaturaEmitidoEm: string;
}

const ESTILOS = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Montserrat', Arial, sans-serif;
    color: #1C1814;
    margin: 0;
    padding: 0;
  }
  header {
    border-bottom: 3px solid #C9A84C;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .monograma {
    color: #C9A84C;
    letter-spacing: 0.25em;
    font-family: 'Georgia', serif;
    font-size: 18px;
  }
  h1 {
    font-family: 'Georgia', serif;
    font-size: 22px;
    color: #0D1A2B;
    margin: 8px 0 4px;
  }
  .subtitulo {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8A8270;
  }
  .dados {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    font-size: 12px;
    margin-bottom: 20px;
  }
  .dados div b {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    color: #8A8270;
    letter-spacing: 0.1em;
    margin-bottom: 3px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  th, td {
    border: 1px solid #E8E4D8;
    padding: 6px 8px;
    text-align: center;
  }
  th {
    background: #0D1A2B;
    color: #F3F1EA;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.1em;
  }
  tr.editado td {
    background: #FEF6E7;
  }
  .total {
    margin-top: 16px;
    padding: 12px;
    background: #F3F1EA;
    text-align: right;
    font-weight: 600;
    color: #0D1A2B;
  }
  .rodape {
    margin-top: 40px;
    font-size: 10px;
    color: #8A8270;
    border-top: 1px solid #E8E4D8;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
  }
`;

export function renderizarEspelhoPontoHtml(d: DadosEspelhoPonto): string {
  const linhas = d.linhas
    .map(
      (l) => `
    <tr class="${l.editado ? 'editado' : ''}">
      <td>${l.data}</td>
      <td>${l.entrada ?? '-'}</td>
      <td>${l.saidaAlmoco ?? '-'}</td>
      <td>${l.retornoAlmoco ?? '-'}</td>
      <td>${l.saidaFinal ?? '-'}</td>
      <td><strong>${l.horasTrabalhadas}</strong></td>
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Espelho de Ponto - ${d.nomeColaborador} - ${d.mes}</title>
<style>${ESTILOS}</style>
</head>
<body>
  <header>
    <div class="monograma">R B</div>
    <h1>Espelho de Ponto Mensal</h1>
    <div class="subtitulo">Reboucas e Bulhoes Advogados Associados</div>
  </header>

  <section class="dados">
    <div><b>Colaborador</b>${d.nomeColaborador}</div>
    <div><b>Matricula</b>${d.matricula}</div>
    <div><b>Perfil</b>${d.perfil}</div>
    <div><b>Mes de referencia</b>${d.mes}</div>
    <div><b>Total de horas</b>${d.totalHoras}</div>
    <div><b>Emitido em</b>${d.assinaturaEmitidoEm}</div>
  </section>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Entrada</th>
        <th>Saida almoco</th>
        <th>Retorno almoco</th>
        <th>Saida final</th>
        <th>Horas</th>
      </tr>
    </thead>
    <tbody>
      ${linhas}
    </tbody>
  </table>

  <div class="total">Total no mes: ${d.totalHoras}</div>

  <footer class="rodape">
    <span>Registros editados estao destacados em fundo amarelo.</span>
    <span>Documento gerado automaticamente pela Plataforma Interna.</span>
  </footer>
</body>
</html>`;
}
