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

/** Couleurs de badges — cohérentes intervention / devis / facture / pièces */
export const StatusColors = {
  violet: { bg: '#EDE9FE', text: '#6D28D9', border: '#8B5CF6' },
  orange: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  ambre: { bg: '#FEF9C3', text: '#A16207', border: '#EAB308' },
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
  diagnostic: { label: 'Diagnostic', tone: 'violet' },
  attente_validation_devis: { label: 'Attente devis', tone: 'orange' },
  attente_pieces: { label: 'Attente pièces', tone: 'ambre' },
  en_cours: { label: 'En cours', tone: 'bleu' },
  termine: { label: 'Terminé', tone: 'vert' },
  recupere: { label: 'Récupéré', tone: 'gris' },
};

export const PieceCommandeeStatutMeta: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  a_commander: { label: 'À commander', tone: 'orange' },
  commandee: { label: 'Commandée', tone: 'bleu' },
  recue: { label: 'Reçue', tone: 'vert' },
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

export const NiveauCarburantOptions: {
  value: string;
  label: string;
}[] = [
  { value: 'reserve', label: 'Réserve' },
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: '3/4', label: '3/4' },
  { value: 'plein', label: 'Plein' },
];
