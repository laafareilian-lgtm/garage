export type InterventionStatut =
  | 'en_attente'
  | 'en_cours'
  | 'termine'
  | 'recupere';

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse';

export type FactureStatut = 'impayee' | 'payee' | 'annulee';

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
}

export interface Vehicule {
  id: string;
  clientId: string;
  plaque: string;
  marque: string;
  modele: string;
  annee?: number;
  kilometrage?: number;
  vin?: string;
}

export interface Piece {
  nom: string;
  quantite: number;
  prixUnitaire?: number;
}

export interface Intervention {
  id: string;
  vehiculeId: string;
  dateEntree: string;
  dateSortiePrevue?: string;
  dateSortieReelle?: string;
  motif: string;
  travauxEffectues: string;
  pieces: Piece[];
  statut: InterventionStatut;
  devisId?: string;
  factureId?: string;
  notes?: string;
}

export interface LigneDocument {
  id: string;
  description: string;
  quantite: number;
  prixUnitaireHT: number;
  tvaPct: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export interface Devis {
  id: string;
  interventionId: string;
  numero: string;
  dateCreation: string;
  dateValidite?: string;
  lignes: LigneDocument[];
  sousTotalHT: number;
  totalTVA: number;
  totalTTC: number;
  statut: DevisStatut;
  notes?: string;
}

export interface Facture {
  id: string;
  interventionId: string;
  devisId?: string;
  numero: string;
  dateEmission: string;
  dateEcheance?: string;
  lignes: LigneDocument[];
  sousTotalHT: number;
  totalTVA: number;
  totalTTC: number;
  statut: FactureStatut;
  datePaiement?: string;
}

export type CreateClientInput = Omit<Client, 'id'>;

export type CreateVehiculeInput = Omit<Vehicule, 'id'>;

export type CreateInterventionInput = Omit<
  Intervention,
  'id' | 'travauxEffectues' | 'pieces' | 'statut' | 'devisId' | 'factureId'
> & {
  travauxEffectues?: string;
  pieces?: Piece[];
  statut?: InterventionStatut;
};

export type UpdateInterventionInput = Partial<
  Omit<Intervention, 'id' | 'vehiculeId'>
>;

export interface InterventionEnrichie extends Intervention {
  vehicule: Vehicule;
  client: Client;
}

export interface DocumentEnrichi {
  client: Client;
  vehicule: Vehicule;
  intervention: Intervention;
}
