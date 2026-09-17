import type { LigneDocument } from '@/types';

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculerLigne(
  description: string,
  quantite: number,
  prixUnitaireHT: number,
  tvaPct: number = 21,
  id?: string
): LigneDocument {
  const totalHT = round2(quantite * prixUnitaireHT);
  const totalTVA = round2(totalHT * (tvaPct / 100));
  const totalTTC = round2(totalHT + totalTVA);

  return {
    id: id ?? `ligne-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    quantite,
    prixUnitaireHT,
    tvaPct,
    totalHT,
    totalTVA,
    totalTTC,
  };
}

export function recalculerLigne(ligne: LigneDocument): LigneDocument {
  return calculerLigne(
    ligne.description,
    ligne.quantite,
    ligne.prixUnitaireHT,
    ligne.tvaPct,
    ligne.id
  );
}

export function calculerTotaux(lignes: LigneDocument[]): {
  sousTotalHT: number;
  totalTVA: number;
  totalTTC: number;
} {
  const sousTotalHT = round2(lignes.reduce((s, l) => s + l.totalHT, 0));
  const totalTVA = round2(lignes.reduce((s, l) => s + l.totalTVA, 0));
  const totalTTC = round2(lignes.reduce((s, l) => s + l.totalTTC, 0));
  return { sousTotalHT, totalTVA, totalTTC };
}
