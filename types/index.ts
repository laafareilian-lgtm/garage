export type InterventionStatut =
  | 'diagnostic'
  | 'attente_validation_devis'
  | 'attente_pieces'
  | 'en_cours'
  | 'termine'
  | 'recupere';

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse';

export type FactureStatut = 'impayee' | 'payee' | 'annulee';

export type DevisType = 'initial' | 'complementaire';

export type NiveauCarburant = 'reserve' | '1/4' | '1/2' | '3/4' | 'plein';

export type PieceCommandeeStatut = 'a_commander' | 'commandee' | 'recue';

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

export interface EtatDesLieux {
  kilometrage: number;
  niveauCarburant: NiveauCarburant;
  degatsExistants?: string;
  photos?: string[];
  date: string;
}

export interface RappelEntretien {
  dateRappel: string;
  motif: string;
}

export interface Intervention {
  id: string;
  vehiculeId: string;
  dateEntree: string;
  dateSortiePrevue?: string;
  dateSortieReelle?: string;
  motifDeclare: string;
  diagnostic?: string;
  travauxEffectues: string;
  pieces: Piece[];
  statut: InterventionStatut;
  devisIds: string[];
  factureId?: string;
  notes?: string;
  etatEntree: EtatDesLieux;
  etatSortie?: EtatDesLieux;
  rappelEntretien?: RappelEntretien;
}

export interface PieceCommandee {
  id: string;
  interventionId: string;
  nom: string;
  fournisseur?: string;
  statut: PieceCommandeeStatut;
  dateCommande?: string;
  dateLivraisonPrevue?: string;
  dateReceptionReelle?: string;
  prixUnitaireEstime?: number;
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
  type: DevisType;
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
  | 'id'
  | 'travauxEffectues'
  | 'pieces'
  | 'statut'
  | 'devisIds'
  | 'factureId'
  | 'diagnostic'
  | 'etatSortie'
  | 'rappelEntretien'
> & {
  travauxEffectues?: string;
  pieces?: Piece[];
  statut?: InterventionStatut;
  diagnostic?: string;
};

export type UpdateInterventionInput = Partial<
  Omit<Intervention, 'id' | 'vehiculeId'>
>;

export type CreatePieceCommandeeInput = Omit<PieceCommandee, 'id' | 'statut'> & {
  statut?: PieceCommandeeStatut;
};

export interface InterventionEnrichie extends Intervention {
  vehicule: Vehicule;
  client: Client;
}

export interface PieceCommandeeEnrichie extends PieceCommandee {
  intervention: Intervention;
  vehicule: Vehicule;
  client: Client;
}

export interface RappelEnrichi {
  intervention: InterventionEnrichie;
  dateRappel: string;
  motif: string;
}

export interface DocumentEnrichi {
  client: Client;
  vehicule: Vehicule;
  intervention: Intervention;
}
