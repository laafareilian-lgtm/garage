import { calculerLigne, calculerTotaux } from '@/utils/calculs';
import type {
  Client,
  Devis,
  Facture,
  Intervention,
  Vehicule,
} from '@/types';

/** Store en mémoire — seule la couche service y accède. */

export const clients: Client[] = [
  {
    id: 'cli-1',
    nom: 'Dupont Marie',
    telephone: '0472 11 22 33',
    email: 'marie.dupont@email.be',
    adresse: '12 rue des Lilas, 1000 Bruxelles',
  },
  {
    id: 'cli-2',
    nom: 'Martin Jean',
    telephone: '0495 44 55 66',
    email: 'j.martin@email.be',
  },
  {
    id: 'cli-3',
    nom: 'Bernard Sophie',
    telephone: '0486 77 88 99',
    adresse: '5 av. Louise, 1050 Ixelles',
  },
  {
    id: 'cli-4',
    nom: 'Lefevre Thomas',
    telephone: '0470 12 34 56',
    email: 'thomas.lefevre@email.be',
  },
  {
    id: 'cli-5',
    nom: 'Petit Camille',
    telephone: '0498 98 76 54',
  },
  {
    id: 'cli-6',
    nom: 'Moreau Lucas',
    telephone: '0475 33 22 11',
    email: 'l.moreau@email.be',
    adresse: '88 chaussée de Wavre, 1040 Etterbeek',
  },
];

export const vehicules: Vehicule[] = [
  {
    id: 'veh-1',
    clientId: 'cli-1',
    plaque: '1-ABC-123',
    marque: 'Volkswagen',
    modele: 'Golf',
    annee: 2019,
    kilometrage: 78500,
    vin: 'WVWZZZ1KZAW123456',
  },
  {
    id: 'veh-2',
    clientId: 'cli-2',
    plaque: '1-XYZ-789',
    marque: 'Peugeot',
    modele: '308',
    annee: 2021,
    kilometrage: 45200,
  },
  {
    id: 'veh-3',
    clientId: 'cli-3',
    plaque: '2-KLM-456',
    marque: 'Renault',
    modele: 'Clio',
    annee: 2018,
    kilometrage: 112000,
  },
  {
    id: 'veh-4',
    clientId: 'cli-4',
    plaque: '1-DEF-321',
    marque: 'BMW',
    modele: '320d',
    annee: 2020,
    kilometrage: 63400,
    vin: 'WBA8E9G50LNU12345',
  },
  {
    id: 'veh-5',
    clientId: 'cli-5',
    plaque: '2-GHI-654',
    marque: 'Toyota',
    modele: 'Yaris',
    annee: 2022,
    kilometrage: 28100,
  },
  {
    id: 'veh-6',
    clientId: 'cli-6',
    plaque: '1-NOP-987',
    marque: 'Audi',
    modele: 'A4',
    annee: 2017,
    kilometrage: 145800,
  },
];

export const interventions: Intervention[] = [
  {
    id: 'int-1',
    vehiculeId: 'veh-1',
    dateEntree: '2026-09-15',
    dateSortiePrevue: '2026-09-18',
    motif: 'Bruit suspect à l’avant gauche, freinage',
    travauxEffectues: 'Contrôle plaquettes et disques AV — usure avancée',
    pieces: [
      { nom: 'Plaquettes AV', quantite: 1, prixUnitaire: 65 },
      { nom: 'Disques AV', quantite: 2, prixUnitaire: 55 },
    ],
    statut: 'en_cours',
    devisId: 'dev-1',
  },
  {
    id: 'int-2',
    vehiculeId: 'veh-2',
    dateEntree: '2026-09-16',
    dateSortiePrevue: '2026-09-17',
    motif: 'Voyant moteur allumé',
    travauxEffectues: 'Diagnostic OBD en cours',
    pieces: [],
    statut: 'en_attente',
  },
  {
    id: 'int-3',
    vehiculeId: 'veh-3',
    dateEntree: '2026-09-14',
    dateSortiePrevue: '2026-09-19',
    motif: 'Révision 110 000 km + climatisation',
    travauxEffectues:
      'Vidange, filtres, recharge clim — en attente pièce filtre habitacle',
    pieces: [
      { nom: 'Huile 5W30', quantite: 4, prixUnitaire: 12 },
      { nom: 'Filtre à huile', quantite: 1, prixUnitaire: 18 },
    ],
    statut: 'en_cours',
    devisId: 'dev-2',
  },
  {
    id: 'int-4',
    vehiculeId: 'veh-4',
    dateEntree: '2026-09-10',
    dateSortiePrevue: '2026-09-12',
    dateSortieReelle: '2026-09-12',
    motif: 'Pneus avant usés',
    travauxEffectues: 'Remplacement 2 pneus AV + géométrie',
    pieces: [
      { nom: 'Pneu 225/45 R17', quantite: 2, prixUnitaire: 95 },
      { nom: 'Géométrie', quantite: 1, prixUnitaire: 70 },
    ],
    statut: 'termine',
    devisId: 'dev-3',
    factureId: 'fac-1',
  },
  {
    id: 'int-5',
    vehiculeId: 'veh-5',
    dateEntree: '2026-09-08',
    dateSortieReelle: '2026-09-09',
    motif: 'Batterie déchargée',
    travauxEffectues: 'Remplacement batterie + test alternateur OK',
    pieces: [{ nom: 'Batterie 60Ah', quantite: 1, prixUnitaire: 120 }],
    statut: 'recupere',
    factureId: 'fac-2',
  },
  {
    id: 'int-6',
    vehiculeId: 'veh-6',
    dateEntree: '2026-09-17',
    motif: 'Fuite d’huile moteur',
    travauxEffectues: '',
    pieces: [],
    statut: 'en_attente',
  },
  {
    id: 'int-7',
    vehiculeId: 'veh-1',
    dateEntree: '2026-06-02',
    dateSortieReelle: '2026-06-03',
    motif: 'Vidange + révision',
    travauxEffectues: 'Vidange complète + filtres',
    pieces: [
      { nom: 'Huile', quantite: 4, prixUnitaire: 11 },
      { nom: 'Filtre huile', quantite: 1, prixUnitaire: 16 },
    ],
    statut: 'recupere',
    factureId: 'fac-3',
  },
  {
    id: 'int-8',
    vehiculeId: 'veh-3',
    dateEntree: '2026-03-20',
    dateSortieReelle: '2026-03-22',
    motif: 'Embrayage qui patine',
    travauxEffectues: 'Remplacement kit embrayage',
    pieces: [{ nom: 'Kit embrayage', quantite: 1, prixUnitaire: 280 }],
    statut: 'recupere',
    devisId: 'dev-4',
    factureId: 'fac-4',
  },
  {
    id: 'int-9',
    vehiculeId: 'veh-4',
    dateEntree: '2026-09-17',
    dateSortiePrevue: '2026-09-20',
    motif: 'Contrôle technique — corrections',
    travauxEffectues: 'Éclairage AR, essuie-glace',
    pieces: [{ nom: 'Ampoule LED AR', quantite: 2, prixUnitaire: 25 }],
    statut: 'en_cours',
  },
  {
    id: 'int-10',
    vehiculeId: 'veh-2',
    dateEntree: '2026-08-01',
    dateSortieReelle: '2026-08-02',
    motif: 'Climatisation faible',
    travauxEffectues: 'Recharge gaz + détection fuites OK',
    pieces: [{ nom: 'Recharge clim', quantite: 1, prixUnitaire: 89 }],
    statut: 'recupere',
    devisId: 'dev-5',
  },
];

const l1 = [
  calculerLigne('Main-d’œuvre freinage', 1.5, 65),
  calculerLigne('Plaquettes avant', 1, 65),
  calculerLigne('Disques avant (paire)', 1, 110),
];
const t1 = calculerTotaux(l1);

const l2 = [
  calculerLigne('Révision complète', 1, 180),
  calculerLigne('Recharge climatisation', 1, 95),
  calculerLigne('Filtre habitacle', 1, 28),
];
const t2 = calculerTotaux(l2);

const l3 = [
  calculerLigne('Pneu 225/45 R17', 2, 95),
  calculerLigne('Montage + équilibrage', 2, 18),
  calculerLigne('Géométrie', 1, 70),
];
const t3 = calculerTotaux(l3);

const l4 = [
  calculerLigne('Kit embrayage', 1, 280),
  calculerLigne('Main-d’œuvre embrayage', 4, 65),
];
const t4 = calculerTotaux(l4);

const l5 = [calculerLigne('Recharge climatisation', 1, 89)];
const t5 = calculerTotaux(l5);

const lFac2 = [
  calculerLigne('Batterie 60Ah', 1, 120),
  calculerLigne('Main-d’œuvre', 0.5, 65),
];
const tFac2 = calculerTotaux(lFac2);

const lFac3 = [
  calculerLigne('Vidange + filtres', 1, 95),
  calculerLigne('Main-d’œuvre', 1, 65),
];
const tFac3 = calculerTotaux(lFac3);

export const devis: Devis[] = [
  {
    id: 'dev-1',
    interventionId: 'int-1',
    numero: 'DEV-2026-001',
    dateCreation: '2026-09-15',
    dateValidite: '2026-09-29',
    lignes: l1,
    ...t1,
    statut: 'envoye',
  },
  {
    id: 'dev-2',
    interventionId: 'int-3',
    numero: 'DEV-2026-002',
    dateCreation: '2026-09-14',
    dateValidite: '2026-09-28',
    lignes: l2,
    ...t2,
    statut: 'brouillon',
  },
  {
    id: 'dev-3',
    interventionId: 'int-4',
    numero: 'DEV-2026-003',
    dateCreation: '2026-09-10',
    lignes: l3,
    ...t3,
    statut: 'accepte',
  },
  {
    id: 'dev-4',
    interventionId: 'int-8',
    numero: 'DEV-2026-004',
    dateCreation: '2026-03-20',
    lignes: l4,
    ...t4,
    statut: 'accepte',
  },
  {
    id: 'dev-5',
    interventionId: 'int-10',
    numero: 'DEV-2026-005',
    dateCreation: '2026-08-01',
    lignes: l5,
    ...t5,
    statut: 'refuse',
    notes: 'Client a reporté',
  },
];

export const factures: Facture[] = [
  {
    id: 'fac-1',
    interventionId: 'int-4',
    devisId: 'dev-3',
    numero: 'FAC-2026-001',
    dateEmission: '2026-09-12',
    dateEcheance: '2026-09-26',
    lignes: l3,
    ...t3,
    statut: 'payee',
    datePaiement: '2026-09-12',
  },
  {
    id: 'fac-2',
    interventionId: 'int-5',
    numero: 'FAC-2026-002',
    dateEmission: '2026-09-09',
    dateEcheance: '2026-09-23',
    lignes: lFac2,
    ...tFac2,
    statut: 'payee',
    datePaiement: '2026-09-09',
  },
  {
    id: 'fac-3',
    interventionId: 'int-7',
    numero: 'FAC-2026-003',
    dateEmission: '2026-06-03',
    lignes: lFac3,
    ...tFac3,
    statut: 'payee',
    datePaiement: '2026-06-03',
  },
  {
    id: 'fac-4',
    interventionId: 'int-8',
    devisId: 'dev-4',
    numero: 'FAC-2026-004',
    dateEmission: '2026-03-22',
    dateEcheance: '2026-04-05',
    lignes: l4,
    ...t4,
    statut: 'impayee',
  },
];

export let devisSeq = 6;
export let factureSeq = 5;
export let idSeq = 100;

export function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export function nextDevisNumero(): string {
  const n = String(devisSeq).padStart(3, '0');
  devisSeq += 1;
  return `DEV-2026-${n}`;
}

export function nextFactureNumero(): string {
  const n = String(factureSeq).padStart(3, '0');
  factureSeq += 1;
  return `FAC-2026-${n}`;
}
