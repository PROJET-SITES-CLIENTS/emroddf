// ══════════════════════════════════════════════════════════════════
// Calcul de l'acompte — logique unique partagée (API serveur).
// Le front duplique cette logique pour l'affichage (src/lib/api.ts).
// ══════════════════════════════════════════════════════════════════

export type DepositMode = 'percent' | 'fixed' | 'none';

/**
 * Calcule le montant d'acompte (GNF) pour un produit.
 *
 * @returns le montant en GNF, ou `null` si le paiement en ligne est
 *          désactivé (mode 'none') ou si la configuration est invalide.
 */
export function computeDeposit(
  priceTotal: number,
  mode: string | null | undefined,
  value: number | null | undefined
): number | null {
  if (mode === 'none') return null;

  if (mode === 'fixed') {
    const amount = Math.round(Number(value) || 0);
    return amount > 0 ? amount : null;
  }

  // Mode par défaut : pourcentage du prix total
  const percent = Math.min(Math.max(Number(value) || 0, 0), 100);
  if (percent <= 0) return null;
  const price = Number(priceTotal) || 0;
  if (price <= 0) return null;
  return Math.round((price * percent) / 100);
}

/** Libellé lisible du mode d'acompte (utilisé dans les réponses API). */
export function depositLabel(mode: string, value: number): string {
  if (mode === 'none') return 'Paiement en ligne désactivé';
  if (mode === 'fixed') return `Acompte fixe : ${new Intl.NumberFormat('fr-FR').format(value)} GNF`;
  return `Acompte : ${value}% du prix`;
}
