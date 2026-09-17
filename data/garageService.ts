import { calculerTotaux, recalculerLigne } from '@/utils/calculs';
import { addDaysISO, todayISO } from '@/utils/format';
import type {
  Client,
  CreateClientInput,
  CreateInterventionInput,
  CreateVehiculeInput,
  Devis,
  DevisStatut,
  DocumentEnrichi,
  Facture,
  FactureStatut,
  Intervention,
  InterventionEnrichie,
  LigneDocument,
  UpdateInterventionInput,
  Vehicule,
} from '@/types';
import * as store from './mockStore';

const DELAY_MS = 280;

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

function enrichDocument(
  interventionId: string
): DocumentEnrichi {
  const intervention = store.interventions.find((i) => i.id === interventionId);
  if (!intervention) throw new Error('Intervention introuvable');
  const { vehicule, client } = enrichIntervention(intervention);
  return { intervention, vehicule, client };
}

function normalizeLignes(lignes: LigneDocument[]): LigneDocument[] {
  return lignes.map(recalculerLigne);
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

  async getVehiculeById(id: string): Promise<(Vehicule & { client: Client }) | null> {
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
      en_attente: 0,
      en_cours: 1,
      termine: 2,
      recupere: 3,
    };
    return store.interventions
      .filter((i) => i.statut === 'en_attente' || i.statut === 'en_cours' || i.statut === 'termine')
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

  async createIntervention(data: CreateInterventionInput): Promise<Intervention> {
    await wait();
    const intervention: Intervention = {
      id: store.nextId('int'),
      travauxEffectues: data.travauxEffectues ?? '',
      pieces: data.pieces ?? [],
      statut: data.statut ?? 'en_attente',
      vehiculeId: data.vehiculeId,
      dateEntree: data.dateEntree,
      dateSortiePrevue: data.dateSortiePrevue,
      dateSortieReelle: data.dateSortieReelle,
      motif: data.motif,
      notes: data.notes,
    };
    store.interventions.unshift(intervention);
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

  async createDevis(
    interventionId: string,
    lignes: LigneDocument[]
  ): Promise<Devis> {
    await wait();
    const intervention = store.interventions.find((i) => i.id === interventionId);
    if (!intervention) throw new Error('Intervention introuvable');
    if (intervention.devisId) {
      throw new Error('Un devis existe déjà pour cette intervention');
    }

    const lignesNorm = normalizeLignes(lignes);
    const totaux = calculerTotaux(lignesNorm);
    const created: Devis = {
      id: store.nextId('dev'),
      interventionId,
      numero: store.nextDevisNumero(),
      dateCreation: todayISO(),
      dateValidite: addDaysISO(14),
      lignes: lignesNorm,
      ...totaux,
      statut: 'brouillon',
    };
    store.devis.push(created);
    intervention.devisId = created.id;
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
    const intervention = store.interventions.find(
      (i) => i.id === d.interventionId
    );
    if (!intervention) throw new Error('Intervention introuvable');
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
    const intervention = store.interventions.find((i) => i.id === interventionId);
    if (!intervention) throw new Error('Intervention introuvable');
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

  async updateFactureStatut(id: string, statut: FactureStatut): Promise<Facture> {
    return this.updateFacture(id, { statut });
  },
};
