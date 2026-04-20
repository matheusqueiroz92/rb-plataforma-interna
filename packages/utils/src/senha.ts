import { SENHA_MIN_CARACTERES } from '@rb/constants';

export interface ValidacaoSenha {
  valida: boolean;
  motivos: string[];
}

export function validarForcaSenha(
  senha: string,
  nome?: string,
  matricula?: string,
): ValidacaoSenha {
  const motivos: string[] = [];

  if (senha.length < SENHA_MIN_CARACTERES) {
    motivos.push(`A senha deve ter ao menos ${SENHA_MIN_CARACTERES} caracteres.`);
  }
  if (!/[A-Z]/.test(senha)) {
    motivos.push('A senha deve conter ao menos uma letra maiuscula.');
  }
  if (!/[a-z]/.test(senha)) {
    motivos.push('A senha deve conter ao menos uma letra minuscula.');
  }
  if (!/[0-9]/.test(senha)) {
    motivos.push('A senha deve conter ao menos um numero.');
  }
  if (!/[^A-Za-z0-9]/.test(senha)) {
    motivos.push('A senha deve conter ao menos um caractere especial.');
  }

  if (nome) {
    const primeiroNome = nome.split(' ')[0]?.toLowerCase();
    if (primeiroNome && primeiroNome.length >= 3 && senha.toLowerCase().includes(primeiroNome)) {
      motivos.push('A senha nao pode conter o nome do usuario.');
    }
  }
  if (matricula && senha.includes(matricula)) {
    motivos.push('A senha nao pode conter a matricula.');
  }

  return { valida: motivos.length === 0, motivos };
}
