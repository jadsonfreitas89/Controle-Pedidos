import { Solicitacao } from '../types/solicitacao';

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENTE: 4,
  ALTA: 3,
  NORMAL: 2,
  BAIXA: 1,
};

export function isEntregueOuConcluido(s: Solicitacao | any): boolean {
  if (!s) return false;
  const sit = String(s.situacao || '').trim().toUpperCase();
  const st = String(s.statusCompra || '').trim().toUpperCase();
  return sit === 'ENTREGUE' || st === 'ENTREGUE';
}

export function parseDateTimestamp(value: any): number {
  if (!value) return 0;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? 0 : value.getTime();
  }
  const text = String(value).trim();
  if (!text) return 0;

  // Match DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = Number(brMatch[3]);
    const hour = Number(brMatch[4] || 0);
    const min = Number(brMatch[5] || 0);
    const sec = Number(brMatch[6] || 0);
    const d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  const d = new Date(text);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Ordena solicitações conforme as regras técnicas de negócio:
 * GRUPO 1 — AINDA NÃO COMPRADOS / NÃO ENTREGUES (Rank 1)
 *   - Prioridade: URGENTE (4) -> ALTA (3) -> NORMAL (2) -> BAIXA (1)
 * GRUPO 2 — JÁ COMPRADOS / ENTREGUES (Rank 2)
 *   - Prioridade: URGENTE (4) -> ALTA (3) -> NORMAL (2) -> BAIXA (1)
 * 
 * Desempate secundário: Data/Hora da solicitação (mais antiga primeiro).
 */
export function ordenarSolicitacoes<T extends Solicitacao>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    // 1. Grupo (Grupo 1: Não Entregue/Não Comprado = 1 | Grupo 2: Entregue/Comprado = 2)
    const grupoA = isEntregueOuConcluido(a) ? 2 : 1;
    const grupoB = isEntregueOuConcluido(b) ? 2 : 1;
    if (grupoA !== grupoB) {
      return grupoA - grupoB;
    }

    // 2. Prioridade dentro do grupo (URGENTE > ALTA > NORMAL > BAIXA)
    const pA = PRIORITY_WEIGHT[String(a.prioridade || '').trim().toUpperCase()] || 0;
    const pB = PRIORITY_WEIGHT[String(b.prioridade || '').trim().toUpperCase()] || 0;
    if (pA !== pB) {
      return pB - pA;
    }

    // 3. Desempate: Data/Hora da solicitação (mais antiga primeiro)
    const tA = parseDateTimestamp(a.dataHora || a.dataPedido);
    const tB = parseDateTimestamp(b.dataHora || b.dataPedido);
    if (tA !== tB) {
      return tA - tB;
    }

    // 4. Critério secundário final estável por Protocolo
    return String(a.protocolo || '').localeCompare(String(b.protocolo || ''));
  });
}
