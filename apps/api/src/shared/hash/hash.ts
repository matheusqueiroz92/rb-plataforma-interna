import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, env.BCRYPT_COST);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
