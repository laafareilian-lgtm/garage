import { calculerTotaux, recalculerLigne } from '@/utils/calculs';
import { addDaysISO, todayISO } from '@/utils/format';
import type {
  Client,
  CreateClientInput,
  CreateInterventionInput,
  CreatePieceCommandeeInput,
  CreateVehiculeInput,
  Devis,
  DevisStatut,
  DocumentEnrichi,
  EtatDesLieux,
  Facture,
  FactureStatut,
  Intervention,
  InterventionEnrichie,
  LigneDocument,
  PieceCommandee,
  PieceCommandeeEnrichie,
  PieceCommandeeStatut,
  RappelEnrichi,
  RappelEntretien,
  UpdateInterventionInput,
  Vehicule,
} from '@/types';
import * as store from './mockStore';

const DELAY_MS = 280;

const ACTIFS: Intervention['statut'][] = [
  'diagnostic',
  'attente_validation_devis',
  'attente_pieces',
  'en_cours',
  'termine',
];

function wait(ms = DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enrichIntervention(i: Intervention): InterventionEnrichie {
  const vehicule = store.vehicules.find((v) => v.id === i.vehiculeId);
  if (!vehicule) {
    throw new Error(`Véhicule introuvable: ${i.vehiculeId}`);
  }
  const client = store.clients.find((c) => c.id === vehicule.clientId);
  if (!client) {
    throw new Error(`Client introuvable: ${vehicule.clientId}`);
  }
  return { ...i, vehicule, client };
}

function enrichDocument(interventionId: string): DocumentEnrichi {
  const intervention = store.interventions.find((i) => i.id === interventionId);
  if (!intervention) throw new Error('Intervention introuvable');
  const { vehicule, client } = enrichIntervention(intervention);
  return { intervention, vehicule, client };
}

function enrichPiece(p: PieceCommandee): PieceCommandeeEnrichie {
  const intervention = store.interventions.find((i) => i.id === p.interventionId);
  if (!intervention) throw new Error('Intervention introuvable');
  const { vehicule, client } = enrichIntervention(intervention);
  return { ...p, intervention, vehicule, client };
}

function normalizeLignes(lignes: LigneDocument[]): LigneDocument[] {
  return lignes.map(recalculerLigne);
}

function requireIntervention(id: string): Intervention {
  const found = store.interventions.find((i) => i.id === id);
  if (!found) throw new Error('Intervention introuvable');
  return found;
}

/** SEULE porte d'entrée données — à remplacer plus tard par supabase-js. */
export const garageService = {
  async listClients(): Promise<Client[]> {
    await wait();
    return [...store.clients].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  },

  async getClientById(id: string): Promise<Client | null> {
    await wait();
    return store.clients.find((c) => c.id === id) ?? null;
  },

  async createClient(data: CreateClientInput): Promise<Client> {
    await wait();
    const client: Client = { id: store.nextId('cli'), ...data };
    store.clients.push(client);
    return client;
  },

  async listVehicules(clientId?: string): Promise<Vehicule[]> {
    await wait();
    const list = clientId
      ? store.vehicules.filter((v) => v.clientId === clientId)
      : [...store.vehicules];
    return list.sort((a, b) => a.plaque.localeCompare(b.plaque, 'fr'));
  },

  async getVehiculeById(
    id: string
  ): Promise<(Vehicule & { client: Client }) | null> {
    await wait();
    const vehicule = store.vehicules.find((v) => v.id === id);
    if (!vehicule) return null;
    const client = store.clients.find((c) => c.id === vehicule.clientId);
    if (!client) return null;
    return { ...vehicule, client };
  },

  async createVehicule(data: CreateVehiculeInput): Promise<Vehicule> {
    await wait();
    const vehicule: Vehicule = { id: store.nextId('veh'), ...data };
    store.vehicules.push(vehicule);
    return vehicule;
  },

  async listInterventions(vehiculeId?: string): Promise<InterventionEnrichie[]> {
    await wait();
    const list = vehiculeId
      ? store.interventions.filter((i) => i.vehiculeId === vehiculeId)
      : [...store.interventions];
    return list
      .map(enrichIntervention)
      .sort((a, b) => b.dateEntree.localeCompare(a.dateEntree));
  },

  async listInterventionsActives(): Promise<InterventionEnrichie[]> {
    await wait();
    const ordre: Record<string, number> = {
      diagnostic: 0,
      attente_validation_devis: 1,
      attente_pieces: 2,
      en_cours: 3,
      termine: 4,
      recupere: 5,
    };
    return store.interventions
      .filter((i) => ACTIFS.includes(i.statut))
      .map(enrichIntervention)
      .sort((a, b) => {
        const d = (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9);
        if (d !== 0) return d;
        return b.dateEntree.localeCompare(a.dateEntree);
      });
  },

  async getInterventionById(id: string): Promise<InterventionEnrichie | null> {
    await wait();
    const found = store.interventions.find((i) => i.id === id);
    return found ? enrichIntervention(found) : null;
  },

  async createIntervention(
    data: CreateInterventionInput
  ): Promise<Intervention> {
    await wait();
    const aCommander = (data.piecesACommander ?? []).filter((p) =>
      p.nom.trim()
    );
    const intervention: Intervention = {
      id: store.nextId('int'),
      travauxEffectues: data.travauxEffectues ?? '',
      pieces: data.pieces ?? [],
      statut:
        data.statut ??
        (aCommander.length > 0 ? 'attente_pieces' : 'diagnostic'),
      devisIds: [],
      vehiculeId: data.vehiculeId,
      dateEntree: data.dateEntree,
      dateSortiePrevue: data.dateSortiePrevue,
      dateSortieReelle: data.dateSortieReelle,
      motifDeclare: data.motifDeclare,
      diagnostic: data.diagnostic,
      notes: data.notes,
      etatEntree: data.etatEntree,
    };
    store.interventions.unshift(intervention);

    for (const p of aCommander) {
      store.piecesCommandees.push({
        id: store.nextId('pc'),
        interventionId: intervention.id,
        nom: p.nom.trim(),
        fournisseur: p.fournisseur?.trim() || undefined,
        prixUnitaireEstime: p.prixUnitaireEstime,
        statut: 'a_commander',
      });
    }

    return intervention;
  },

  async updateIntervention(
    id: string,
    data: UpdateInterventionInput
  ): Promise<Intervention> {
    await wait();
    const idx = store.interventions.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error('Intervention introuvable');
    store.interventions[idx] = { ...store.interventions[idx], ...data };
    return store.interventions[idx];
  },

  async updateDiagnostic(
    interventionId: string,
    texte: string
  ): Promise<Intervention> {
    await wait();
    const intervention = requireIntervention(interventionId);
    intervention.diagnostic = texte;
    return intervention;
  },

  async setEtatSortie(
    interventionId: string,
    etatDesLieux: EtatDesLieux
  ): Promise<Intervention> {
    await wait();
    const intervention = requireIntervention(interventionId);
    intervention.etatSortie = etatDesLieux;
    return intervention;
  },

  async setRappelEntretien(
    interventionId: string,
    data: RappelEntretien
  ): Promise<Intervention> {
    await wait();
    const intervention = requireIntervention(interventionId);
    intervention.rappelEntretien = data;
    return intervention;
  },

  async listRappelsAVenir(): Promise<RappelEnrichi[]> {
    await wait();
    return store.interventions
      .filter((i) => i.rappelEntretien)
      .map((i) => {
        const enriched = enrichIntervention(i);
        return {
          intervention: enriched,
          dateRappel: i.rappelEntretien!.dateRappel,
          motif: i.rappelEntretien!.motif,
        };
      })
      .sort((a, b) => a.dateRappel.localeCompare(b.dateRappel));
  },

  async listPiecesCommandees(
    interventionId?: string
  ): Promise<PieceCommandeeEnrichie[]> {
    await wait();
    const list = interventionId
      ? store.piecesCommandees.filter((p) => p.interventionId === interventionId)
      : [...store.piecesCommandees];
    return list.map(enrichPiece);
  },

  async createPieceCommandee(
    data: CreatePieceCommandeeInput
  ): Promise<PieceCommandee> {
    await wait();
    requireIntervention(data.interventionId);
    const piece: PieceCommandee = {
      id: store.nextId('pc'),
      statut: data.statut ?? 'a_commander',
      interventionId: data.interventionId,
      nom: data.nom,
      fournisseur: data.fournisseur,
      dateCommande: data.dateCommande,
      dateLivraisonPrevue: data.dateLivraisonPrevue,
      dateReceptionReelle: data.dateReceptionReelle,
      prixUnitaireEstime: data.prixUnitaireEstime,
    };
    store.piecesCommandees.push(piece);
    return piece;
  },

  async updatePieceStatut(
    id: string,
    statut: PieceCommandeeStatut
  ): Promise<PieceCommandee> {
    await wait();
    const piece = store.piecesCommandees.find((p) => p.id === id);
    if (!piece) throw new Error('Pièce introuvable');
    piece.statut = statut;
    if (statut === 'commandee' && !piece.dateCommande) {
      piece.dateCommande = todayISO();
    }
    if (statut === 'recue' && !piece.dateReceptionReelle) {
      piece.dateReceptionReelle = todayISO();
    }
    return piece;
  },

  async listDevis(): Promise<(Devis & DocumentEnrichi)[]> {
    await wait();
    return [...store.devis]
      .map((d) => ({ ...d, ...enrichDocument(d.interventionId) }))
      .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
  },

  async getDevisById(id: string): Promise<(Devis & DocumentEnrichi) | null> {
    await wait();
    const d = store.devis.find((x) => x.id === id);
    if (!d) return null;
    return { ...d, ...enrichDocument(d.interventionId) };
  },

  async listDevisByIntervention(
    interventionId: string
  ): Promise<(Devis & DocumentEnrichi)[]> {
    await wait();
    return store.devis
      .filter((d) => d.interventionId === interventionId)
      .map((d) => ({ ...d, ...enrichDocument(d.interventionId) }))
      .sort((a, b) => a.dateCreation.localeCompare(b.dateCreation));
  },

  async createDevis(
    interventionId: string,
    lignes: LigneDocument[]
  ): Promise<Devis> {
    await wait();
    const intervention = requireIntervention(interventionId);
    if (intervention.devisIds.length > 0) {
      throw new Error(
        'Un devis initial existe déjà — utilisez un devis complémentaire'
      );
    }

    const lignesNorm = normalizeLignes(lignes);
    const totaux = calculerTotaux(lignesNorm);
    const created: Devis = {
      id: store.nextId('dev'),
      interventionId,
      numero: store.nextDevisNumero(),
      type: 'initial',
      dateCreation: todayISO(),
      dateValidite: addDaysISO(14),
      lignes: lignesNorm,
      ...totaux,
      statut: 'brouillon',
    };
    store.devis.push(created);
    intervention.devisIds.push(created.id);
    return created;
  },

  async addDevisComplementaire(
    interventionId: string,
    lignes: LigneDocument[]
  ): Promise<Devis> {
    await wait();
    const intervention = requireIntervention(interventionId);
    if (intervention.devisIds.length === 0) {
      throw new Error('Créez d’abord un devis initial');
    }

    const lignesNorm = normalizeLignes(lignes);
    const totaux = calculerTotaux(lignesNorm);
    const created: Devis = {
      id: store.nextId('dev'),
      interventionId,
      numero: store.nextDevisNumero(),
      type: 'complementaire',
      dateCreation: todayISO(),
      dateValidite: addDaysISO(14),
      lignes: lignesNorm,
      ...totaux,
      statut: 'brouillon',
    };
    store.devis.push(created);
    intervention.devisIds.push(created.id);
    return created;
  },

  async updateDevis(
    id: string,
    patch: Partial<Pick<Devis, 'lignes' | 'notes' | 'dateValidite' | 'statut'>>
  ): Promise<Devis> {
    await wait();
    const idx = store.devis.findIndex((d) => d.id === id);
    if (idx < 0) throw new Error('Devis introuvable');
    const current = store.devis[idx];
    const lignes = patch.lignes
      ? normalizeLignes(patch.lignes)
      : current.lignes;
    const totaux = calculerTotaux(lignes);
    store.devis[idx] = {
      ...current,
      ...patch,
      lignes,
      ...totaux,
    };
    return store.devis[idx];
  },

  async updateDevisStatut(id: string, statut: DevisStatut): Promise<Devis> {
    return this.updateDevis(id, { statut });
  },

  async listFactures(): Promise<(Facture & DocumentEnrichi)[]> {
    await wait();
    return [...store.factures]
      .map((f) => ({ ...f, ...enrichDocument(f.interventionId) }))
      .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));
  },

  async getFactureById(id: string): Promise<(Facture & DocumentEnrichi) | null> {
    await wait();
    const f = store.factures.find((x) => x.id === id);
    if (!f) return null;
    return { ...f, ...enrichDocument(f.interventionId) };
  },

  async genererFactureDepuisDevis(devisId: string): Promise<Facture> {
    await wait();
    const d = store.devis.find((x) => x.id === devisId);
    if (!d) throw new Error('Devis introuvable');
    if (d.statut !== 'accepte') {
      throw new Error('Le devis doit être accepté pour générer une facture');
    }
    const intervention = requireIntervention(d.interventionId);
    if (intervention.factureId) {
      throw new Error('Une facture existe déjà pour cette intervention');
    }

    const lignes = normalizeLignes(d.lignes);
    const totaux = calculerTotaux(lignes);
    const created: Facture = {
      id: store.nextId('fac'),
      interventionId: d.interventionId,
      devisId: d.id,
      numero: store.nextFactureNumero(),
      dateEmission: todayISO(),
      dateEcheance: addDaysISO(14),
      lignes,
      ...totaux,
      statut: 'impayee',
    };
    store.factures.push(created);
    intervention.factureId = created.id;
    return created;
  },

  async createFactureDirecte(
    interventionId: string,
    lignes: LigneDocument[]
  ): Promise<Facture> {
    await wait();
    const intervention = requireIntervention(interventionId);
    if (intervention.factureId) {
      throw new Error('Une facture existe déjà pour cette intervention');
    }

    const lignesNorm = normalizeLignes(lignes);
    const totaux = calculerTotaux(lignesNorm);
    const created: Facture = {
      id: store.nextId('fac'),
      interventionId,
      numero: store.nextFactureNumero(),
      dateEmission: todayISO(),
      dateEcheance: addDaysISO(14),
      lignes: lignesNorm,
      ...totaux,
      statut: 'impayee',
    };
    store.factures.push(created);
    intervention.factureId = created.id;
    return created;
  },

  async updateFacture(
    id: string,
    patch: Partial<
      Pick<Facture, 'lignes' | 'dateEcheance' | 'statut' | 'datePaiement'>
    >
  ): Promise<Facture> {
    await wait();
    const idx = store.factures.findIndex((f) => f.id === id);
    if (idx < 0) throw new Error('Facture introuvable');
    const current = store.factures[idx];
    const lignes = patch.lignes
      ? normalizeLignes(patch.lignes)
      : current.lignes;
    const totaux = calculerTotaux(lignes);
    let datePaiement = patch.datePaiement ?? current.datePaiement;
    if (patch.statut === 'payee' && !datePaiement) {
      datePaiement = todayISO();
    }
    if (patch.statut && patch.statut !== 'payee') {
      datePaiement = undefined;
    }
    store.factures[idx] = {
      ...current,
      ...patch,
      lignes,
      ...totaux,
      datePaiement,
    };
    return store.factures[idx];
  },

  async updateFactureStatut(
    id: string,
    statut: FactureStatut
  ): Promise<Facture> {
    return this.updateFacture(id, { statut });
  },
};
