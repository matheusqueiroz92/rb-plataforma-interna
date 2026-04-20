import { describe, it, expect } from 'vitest';
import { validarForcaSenha } from './senha.js';

describe('validarForcaSenha', () => {
  it('aceita senha forte que respeita todos os criterios', () => {
    const resultado = validarForcaSenha('Forte@2026', 'Larissa', 'RB-0002');
    expect(resultado.valida).toBe(true);
    expect(resultado.motivos).toHaveLength(0);
  });

  it('rejeita senha curta', () => {
    const r = validarForcaSenha('Ab1@');
    expect(r.valida).toBe(false);
    expect(r.motivos).toContainEqual(expect.stringContaining('8 caracteres'));
  });

  it('rejeita senha sem maiuscula', () => {
    const r = validarForcaSenha('senha@123');
    expect(r.valida).toBe(false);
    expect(r.motivos).toContainEqual(expect.stringContaining('maiuscula'));
  });

  it('rejeita senha sem caractere especial', () => {
    const r = validarForcaSenha('Senha1234');
    expect(r.valida).toBe(false);
    expect(r.motivos).toContainEqual(expect.stringContaining('caractere especial'));
  });

  it('rejeita senha contendo primeiro nome', () => {
    const r = validarForcaSenha('Larissa@1', 'Larissa Bulhoes');
    expect(r.valida).toBe(false);
    expect(r.motivos).toContainEqual(expect.stringContaining('nome'));
  });

  it('rejeita senha contendo matricula', () => {
    const r = validarForcaSenha('Abc@RB-0001x', 'Ricardo', 'RB-0001');
    expect(r.valida).toBe(false);
    expect(r.motivos).toContainEqual(expect.stringContaining('matricula'));
  });
});
