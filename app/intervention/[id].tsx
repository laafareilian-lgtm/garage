import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import {
  buildEtatDesLieux,
  EtatDesLieuxFields,
  EtatDesLieuxLecture,
} from '@/components/EtatDesLieuxFields';
import { ChipSelect, FormField, PrimaryButton } from '@/components/Form';
import {
  DevisBadge,
  FactureBadge,
  InterventionBadge,
  PieceBadge,
} from '@/components/StatusBadge';
import { Colors, InterventionStatutMeta } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { calculerLigne } from '@/utils/calculs';
import { addDaysISO, formatDate, formatMontant, todayISO } from '@/utils/format';
import type {
  Devis,
  Facture,
  InterventionEnrichie,
  InterventionStatut,
  NiveauCarburant,
  PieceCommandee,
  PieceCommandeeStatut,
} from '@/types';

const NEXT_PIECE: Record<PieceCommandeeStatut, PieceCommandeeStatut | null> = {
  a_commander: 'commandee',
  commandee: 'recue',
  recue: null,
};

export default function InterventionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<InterventionEnrichie | null>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [piecesCmd, setPiecesCmd] = useState<PieceCommandee[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostic, setDiagnostic] = useState('');
  const [travaux, setTravaux] = useState('');
  const [saving, setSaving] = useState(false);

  const [showSortie, setShowSortie] = useState(false);
  const [etatSortieForm, setEtatSortieForm] = useState({
    kilometrage: '',
    niveauCarburant: '1/2' as NiveauCarburant,
    degatsExistants: '',
    photos: [] as string[],
  });

  const [showRappel, setShowRappel] = useState(false);
  const [rappelDate, setRappelDate] = useState(addDaysISO(180));
  const [rappelMotif, setRappelMotif] = useState('');

  const [showPieceForm, setShowPieceForm] = useState(false);
  const [pieceNom, setPieceNom] = useState('');
  const [pieceFournisseur, setPieceFournisseur] = useState('');
  const [piecePrix, setPiecePrix] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const intervention = await garageService.getInterventionById(id);
      setItem(intervention);
      if (intervention) {
        setDiagnostic(intervention.diagnostic ?? '');
        setTravaux(intervention.travauxEffectues);
        const [devis, pieces] = await Promise.all([
          garageService.listDevisByIntervention(intervention.id),
          garageService.listPiecesCommandees(intervention.id),
        ]);
        setDevisList(devis);
        setPiecesCmd(pieces);
        if (intervention.factureId) {
          setFacture(await garageService.getFactureById(intervention.factureId));
        } else {
          setFacture(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function saveDiagnosticTravaux() {
    if (!item) return;
    setSaving(true);
    try {
      await garageService.updateDiagnostic(item.id, diagnostic);
      await garageService.updateIntervention(item.id, {
        travauxEffectues: travaux,
      });
      Alert.alert('Enregistré', 'Diagnostic et travaux mis à jour.');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatut(statut: string) {
    if (!item) return;
    try {
      const patch: UpdatePatch = {
        statut: statut as InterventionStatut,
      };
      if (statut === 'recupere' && !item.dateSortieReelle) {
        patch.dateSortieReelle = todayISO();
      }
      await garageService.updateIntervention(item.id, patch);
      await load();
      if (statut === 'recupere') {
        setShowRappel(true);
      }
      if (statut === 'termine' && !item.etatSortie) {
        setEtatSortieForm({
          kilometrage: String(item.etatEntree.kilometrage),
          niveauCarburant: item.etatEntree.niveauCarburant,
          degatsExistants: '',
          photos: [],
        });
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  type UpdatePatch = {
    statut: InterventionStatut;
    dateSortieReelle?: string;
  };

  async function saveEtatSortie() {
    if (!item) return;
    const etat = buildEtatDesLieux(etatSortieForm, todayISO());
    if (!etat) {
      Alert.alert('Kilométrage requis');
      return;
    }
    try {
      await garageService.setEtatSortie(item.id, etat);
      setShowSortie(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function saveRappel() {
    if (!item) return;
    if (!rappelMotif.trim() || !rappelDate.trim()) {
      Alert.alert('Rappel', 'Date et motif sont requis.');
      return;
    }
    try {
      await garageService.setRappelEntretien(item.id, {
        dateRappel: rappelDate.trim(),
        motif: rappelMotif.trim(),
      });
      setShowRappel(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function advancePiece(piece: PieceCommandee) {
    const next = NEXT_PIECE[piece.statut];
    if (!next) return;
    try {
      await garageService.updatePieceStatut(piece.id, next);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function addPiece() {
    if (!item || !pieceNom.trim()) {
      Alert.alert('Nom requis');
      return;
    }
    try {
      await garageService.createPieceCommandee({
        interventionId: item.id,
        nom: pieceNom.trim(),
        fournisseur: pieceFournisseur.trim() || undefined,
        prixUnitaireEstime: piecePrix
          ? parseFloat(piecePrix.replace(',', '.'))
          : undefined,
      });
      setPieceNom('');
      setPieceFournisseur('');
      setPiecePrix('');
      setShowPieceForm(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function createDevis() {
    if (!item) return;
    try {
      const lignes =
        item.pieces.length > 0
          ? item.pieces.map((p) =>
              calculerLigne(p.nom, p.quantite, p.prixUnitaire ?? 0)
            )
          : [calculerLigne('Main-d’œuvre', 1, 65)];
      const created = await garageService.createDevis(item.id, lignes);
      router.push(`/devis/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function addComplementaire() {
    if (!item) return;
    try {
      const created = await garageService.addDevisComplementaire(item.id, [
        calculerLigne('Prestation complémentaire', 1, 0),
      ]);
      router.push(`/devis/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function genererFacture(devisId: string) {
    try {
      const created = await garageService.genererFactureDepuisDevis(devisId);
      router.push(`/facture/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function createFactureDirecte() {
    if (!item) return;
    try {
      const created = await garageService.createFactureDirecte(item.id, [
        calculerLigne('Prestation', 1, 0),
      ]);
      router.push(`/facture/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  if (loading) return <LoadingState />;
  if (!item) return <EmptyState message="Intervention introuvable." />;

  const statutOptions = Object.entries(InterventionStatutMeta).map(
    ([value, meta]) => ({ value, label: meta.label })
  );
  const devisAccepte = devisList.find((d) => d.statut === 'accepte');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Pressable onPress={() => router.push(`/vehicule/${item.vehiculeId}`)}>
            <Text style={styles.plaque}>{item.vehicule.plaque}</Text>
          </Pressable>
          <InterventionBadge statut={item.statut} />
        </View>
        <Text style={styles.vehicle}>
          {item.vehicule.marque} {item.vehicule.modele}
        </Text>
        <Text style={styles.client}>{item.client.nom}</Text>
        <Text style={styles.meta}>
          Entrée {formatDate(item.dateEntree)}
          {item.dateSortiePrevue
            ? ` · Prévue ${formatDate(item.dateSortiePrevue)}`
            : ''}
        </Text>
      </View>

      <Text style={styles.section}>Statut</Text>
      <ChipSelect
        options={statutOptions}
        value={item.statut}
        onChange={changeStatut}
      />

      <Text style={styles.section}>Motif déclaré</Text>
      <View style={styles.card}>
        <Text style={styles.body}>{item.motifDeclare}</Text>
      </View>

      <Text style={styles.section}>Diagnostic</Text>
      <TextInput
        style={styles.textarea}
        value={diagnostic}
        onChangeText={setDiagnostic}
        multiline
        placeholder="Ce que vous constatez après examen…"
        placeholderTextColor={Colors.textMuted}
        textAlignVertical="top"
      />

      <Text style={styles.section}>Travaux effectués</Text>
      <TextInput
        style={styles.textarea}
        value={travaux}
        onChangeText={setTravaux}
        multiline
        placeholder="Notes de travail…"
        placeholderTextColor={Colors.textMuted}
        textAlignVertical="top"
      />
      <PrimaryButton
        title={saving ? 'Enregistrement…' : 'Enregistrer diagnostic & travaux'}
        onPress={saveDiagnosticTravaux}
        disabled={saving}
        variant="secondary"
      />

      <Text style={styles.section}>État des lieux</Text>
      <EtatDesLieuxLecture etat={item.etatEntree} title="À l’entrée" />
      {item.etatSortie ? (
        <EtatDesLieuxLecture etat={item.etatSortie} title="À la sortie" />
      ) : item.statut === 'termine' || item.statut === 'recupere' ? (
        <PrimaryButton
          title="Constater l’état de sortie"
          onPress={() => {
            setEtatSortieForm({
              kilometrage: String(item.etatEntree.kilometrage),
              niveauCarburant: item.etatEntree.niveauCarburant,
              degatsExistants: '',
              photos: [],
            });
            setShowSortie(true);
          }}
        />
      ) : null}

      <Text style={styles.section}>Pièces nécessaires</Text>
      <View style={styles.docCard}>
        {piecesCmd.length === 0 ? (
          <Text style={styles.meta}>Aucune pièce suivie.</Text>
        ) : (
          piecesCmd.map((p) => (
            <View key={p.id} style={styles.pieceItem}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.docNum}>{p.nom}</Text>
                {p.fournisseur ? (
                  <Text style={styles.meta}>{p.fournisseur}</Text>
                ) : null}
                <PieceBadge statut={p.statut} />
              </View>
              {NEXT_PIECE[p.statut] ? (
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => advancePiece(p)}
                >
                  <Text style={styles.smallBtnText}>
                    → {NEXT_PIECE[p.statut] === 'commandee' ? 'Commander' : 'Reçue'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
        {showPieceForm ? (
          <View style={{ gap: 8 }}>
            <FormField
              label="Nom"
              value={pieceNom}
              onChangeText={setPieceNom}
              placeholder="Plaquettes AV"
            />
            <FormField
              label="Fournisseur"
              value={pieceFournisseur}
              onChangeText={setPieceFournisseur}
              placeholder="Optionnel"
            />
            <FormField
              label="Prix estimé"
              value={piecePrix}
              onChangeText={setPiecePrix}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <PrimaryButton title="Ajouter" onPress={addPiece} />
          </View>
        ) : (
          <Pressable onPress={() => setShowPieceForm(true)}>
            <Text style={styles.addLink}>+ Ajouter une pièce à suivre</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.section}>Devis liés</Text>
      <View style={styles.docCard}>
        {devisList.length === 0 ? (
          <PrimaryButton title="Créer un devis initial" onPress={createDevis} />
        ) : (
          <>
            {devisList.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/devis/${d.id}`)}
                style={styles.devisRow}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.docNum}>
                    {d.numero}{' '}
                    <Text style={styles.typeTag}>
                      {d.type === 'initial' ? 'initial' : 'complément'}
                    </Text>
                  </Text>
                  <Text style={styles.docAmt}>{formatMontant(d.totalTTC)}</Text>
                </View>
                <DevisBadge statut={d.statut} />
              </Pressable>
            ))}
            <PrimaryButton
              title="+ Ajouter un devis complémentaire"
              onPress={addComplementaire}
              variant="secondary"
            />
          </>
        )}

        {devisAccepte && !facture ? (
          <PrimaryButton
            title={`Générer facture (${devisAccepte.numero})`}
            onPress={() => genererFacture(devisAccepte.id)}
          />
        ) : null}

        {facture ? (
          <Pressable onPress={() => router.push(`/facture/${facture.id}`)}>
            <View style={styles.row}>
              <Text style={styles.docNum}>{facture.numero}</Text>
              <FactureBadge statut={facture.statut} />
            </View>
            <Text style={styles.docAmt}>{formatMontant(facture.totalTTC)}</Text>
          </Pressable>
        ) : devisList.length === 0 ? (
          <PrimaryButton
            title="Créer une facture directe"
            onPress={createFactureDirecte}
            variant="secondary"
          />
        ) : null}
      </View>

      {item.rappelEntretien ? (
        <>
          <Text style={styles.section}>Rappel d’entretien</Text>
          <View style={styles.card}>
            <Text style={styles.body}>{item.rappelEntretien.motif}</Text>
            <Text style={styles.meta}>
              Prévu le {formatDate(item.rappelEntretien.dateRappel)}
            </Text>
          </View>
        </>
      ) : item.statut === 'recupere' ? (
        <PrimaryButton
          title="Définir un rappel d’entretien"
          onPress={() => setShowRappel(true)}
          variant="secondary"
        />
      ) : null}

      <Modal visible={showSortie} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>État de sortie</Text>
            <EtatDesLieuxFields
              value={etatSortieForm}
              onChange={setEtatSortieForm}
            />
            <PrimaryButton title="Enregistrer" onPress={saveEtatSortie} />
            <PrimaryButton
              title="Annuler"
              onPress={() => setShowSortie(false)}
              variant="secondary"
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showRappel} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rappel d’entretien</Text>
            <FormField
              label="Date (AAAA-MM-JJ)"
              value={rappelDate}
              onChangeText={setRappelDate}
              autoCapitalize="none"
            />
            <FormField
              label="Motif"
              value={rappelMotif}
              onChangeText={setRappelMotif}
              placeholder="Vidange dans 6 mois"
              multiline
            />
            <PrimaryButton title="Enregistrer le rappel" onPress={saveRappel} />
            <PrimaryButton
              title="Plus tard"
              onPress={() => setShowRappel(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  plaque: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  vehicle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  client: { fontSize: 14, color: Colors.textMuted },
  meta: { fontSize: 13, color: Colors.textMuted },
  body: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  section: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  textarea: {
    minHeight: 90,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
  },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  pieceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  devisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  docNum: { fontWeight: '800', color: Colors.primary, fontSize: 15 },
  docAmt: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  typeTag: {
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textMuted,
  },
  addLink: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  smallBtn: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
});
