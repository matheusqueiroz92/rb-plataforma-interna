import type { Perfil } from '@rb/constants';
import { podeDelegarPara } from '@rb/constants';

export class RegrasDelegacao {
  static validar(delegador: Perfil, destino: Perfil): { valida: boolean; motivo?: string } {
    if (!podeDelegarPara(delegador, destino)) {
      return {
        valida: false,
        motivo: `Perfil ${delegador} nao pode delegar para ${destino}. Somente hierarquia superior pode delegar.`,
      };
    }
    return { valida: true };
  }

  static podeCriarPara(criador: Perfil, destino: Perfil): boolean {
    // Socio, gestora e assessora junior podem criar demandas; estagiario nao.
    if (criador === 'ESTAGIARIO') return false;
    return podeDelegarPara(criador, destino);
  }

  static podeCorrigir(corretor: Perfil): boolean {
    return corretor !== 'ESTAGIARIO';
  }
}

export function statusAposEntrega(): 'ENTREGUE' {
  return 'ENTREGUE';
}

export function statusAposCorrecao(nota: 0 | 8 | 10): 'CONCLUIDA' | 'EM_CORRECAO' {
  return nota === 0 ? 'EM_CORRECAO' : 'CONCLUIDA';
}
