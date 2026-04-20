const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://plataforma.reboucasebulhoes.com.br/api';

interface FetchOpts extends RequestInit {
  token?: string | null;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    public readonly mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

export async function api<T>(caminho: string, opts: FetchOpts = {}): Promise<T> {
  const { token, headers, ...resto } = opts;
  const headersFinais: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };
  if (token) headersFinais.Authorization = `Bearer ${token}`;

  const resp = await fetch(`${BASE_URL}${caminho}`, { ...resto, headers: headersFinais });
  const texto = await resp.text();
  const corpo = texto ? (JSON.parse(texto) as unknown) : null;

  if (!resp.ok) {
    const erro = corpo as { codigo?: string; mensagem?: string; detalhes?: unknown } | null;
    throw new ApiError(
      resp.status,
      erro?.codigo ?? 'ERRO',
      erro?.mensagem ?? 'Erro na requisicao.',
      erro?.detalhes,
    );
  }
  return corpo as T;
}

export const apiClient = {
  get: <T,>(caminho: string, token?: string | null) => api<T>(caminho, { method: 'GET', token }),
  post: <T,>(caminho: string, body: unknown, token?: string | null) =>
    api<T>(caminho, { method: 'POST', body: JSON.stringify(body), token }),
  put: <T,>(caminho: string, body: unknown, token?: string | null) =>
    api<T>(caminho, { method: 'PUT', body: JSON.stringify(body), token }),
  delete: <T,>(caminho: string, token?: string | null) =>
    api<T>(caminho, { method: 'DELETE', token }),
};
