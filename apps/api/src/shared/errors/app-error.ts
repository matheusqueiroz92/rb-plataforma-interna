export class AppError extends Error {
  public readonly status: number;
  public readonly codigo: string;
  public readonly detalhes?: unknown;

  constructor(
    mensagem: string,
    status: number = 400,
    codigo: string = 'ERRO_APLICACAO',
    detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export class ErroAutenticacao extends AppError {
  constructor(mensagem = 'Nao autenticado') {
    super(mensagem, 401, 'NAO_AUTENTICADO');
  }
}

export class ErroAutorizacao extends AppError {
  constructor(mensagem = 'Acesso negado') {
    super(mensagem, 403, 'ACESSO_NEGADO');
  }
}

export class ErroNaoEncontrado extends AppError {
  constructor(recurso = 'recurso') {
    super(`${recurso} nao encontrado`, 404, 'NAO_ENCONTRADO');
  }
}

export class ErroValidacao extends AppError {
  constructor(mensagem: string, detalhes?: unknown) {
    super(mensagem, 422, 'VALIDACAO', detalhes);
  }
}

export class ErroConflito extends AppError {
  constructor(mensagem: string) {
    super(mensagem, 409, 'CONFLITO');
  }
}

export class ErroNegocio extends AppError {
  constructor(mensagem: string, codigo = 'REGRA_NEGOCIO') {
    super(mensagem, 400, codigo);
  }
}
