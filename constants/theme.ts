export const Colors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1A202C',
  textMuted: '#718096',
  primary: '#1E3A5F',
  primarySoft: '#E8EEF5',
  accent: '#2B6CB0',
  danger: '#C53030',
  white: '#FFFFFF',
  fab: '#1E3A5F',
};

/** Couleurs de badges — cohérentes intervention / devis / facture */
export const StatusColors = {
  orange: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  bleu: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' },
  vert: { bg: '#D1FAE5', text: '#047857', border: '#10B981' },
  rouge: { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444' },
  gris: { bg: '#E5E7EB', text: '#4B5563', border: '#9CA3AF' },
} as const;

export type StatusTone = keyof typeof StatusColors;

export const InterventionStatutMeta: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  en_attente: { label: 'En attente', tone: 'orange' },
  en_cours: { label: 'En cours', tone: 'bleu' },
  termine: { label: 'Terminé', tone: 'vert' },
  recupere: { label: 'Récupéré', tone: 'gris' },
};

export const DevisStatutMeta: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  brouillon: { label: 'Brouillon', tone: 'orange' },
  envoye: { label: 'Envoyé', tone: 'bleu' },
  accepte: { label: 'Accepté', tone: 'vert' },
  refuse: { label: 'Refusé', tone: 'rouge' },
};

export const FactureStatutMeta: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  impayee: { label: 'Impayée', tone: 'rouge' },
  payee: { label: 'Payée', tone: 'vert' },
  annulee: { label: 'Annulée', tone: 'gris' },
};
