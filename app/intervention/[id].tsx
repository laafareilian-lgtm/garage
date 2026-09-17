import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { ChipSelect, PrimaryButton } from '@/components/Form';
import {
  DevisBadge,
  FactureBadge,
  InterventionBadge,
} from '@/components/StatusBadge';
import { Colors, InterventionStatutMeta } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { calculerLigne } from '@/utils/calculs';
import { formatDate, formatMontant } from '@/utils/format';
import type {
  Devis,
  Facture,
  InterventionEnrichie,
  InterventionStatut,
  Piece,
} from '@/types';

export default function InterventionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<InterventionEnrichie | null>(null);
  const [devis, setDevis] = useState<Devis | null>(null);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [travaux, setTravaux] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const intervention = await garageService.getInterventionById(id);
      setItem(intervention);
      if (intervention) {
        setTravaux(intervention.travauxEffectues);
        setPieces([...intervention.pieces]);
        if (intervention.devisId) {
          const d = await garageService.getDevisById(intervention.devisId);
          setDevis(d);
        } else {
          setDevis(null);
        }
        if (intervention.factureId) {
          const f = await garageService.getFactureById(intervention.factureId);
          setFacture(f);
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

  async function saveTravauxPieces() {
    if (!item) return;
    setSaving(true);
    try {
      await garageService.updateIntervention(item.id, {
        travauxEffectues: travaux,
        pieces,
      });
      Alert.alert('Enregistré', 'Travaux et pièces mis à jour.');
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
      const patch: {
        statut: InterventionStatut;
        dateSortieReelle?: string;
      } = { statut: statut as InterventionStatut };
      if (statut === 'recupere' && !item.dateSortieReelle) {
        patch.dateSortieReelle = new Date().toISOString().slice(0, 10);
      }
      await garageService.updateIntervention(item.id, patch);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function createDevis() {
    if (!item) return;
    try {
      const lignes =
        pieces.length > 0
          ? pieces.map((p) =>
              calculerLigne(p.nom, p.quantite, p.prixUnitaire ?? 0)
            )
          : [calculerLigne('Main-d’œuvre', 1, 65)];
      const created = await garageService.createDevis(item.id, lignes);
      router.push(`/devis/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function genererFacture() {
    if (!devis) return;
    try {
      const created = await garageService.genererFactureDepuisDevis(devis.id);
      router.push(`/facture/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  async function createFactureDirecte() {
    if (!item) return;
    try {
      const lignes =
        pieces.length > 0
          ? pieces.map((p) =>
              calculerLigne(p.nom, p.quantite, p.prixUnitaire ?? 0)
            )
          : [calculerLigne('Prestation', 1, 0)];
      const created = await garageService.createFactureDirecte(item.id, lignes);
      router.push(`/facture/${created.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  function updatePiece(index: number, patch: Partial<Piece>) {
    setPieces((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  }

  if (loading) return <LoadingState />;
  if (!item) return <EmptyState message="Intervention introuvable." />;

  const statutOptions = Object.entries(InterventionStatutMeta).map(
    ([value, meta]) => ({ value, label: meta.label })
  );

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
          {item.dateSortieReelle
            ? ` · Sortie ${formatDate(item.dateSortieReelle)}`
            : ''}
        </Text>
        <Text style={styles.motif}>{item.motif}</Text>
      </View>

      <Text style={styles.section}>Statut</Text>
      <ChipSelect
        options={statutOptions}
        value={item.statut}
        onChange={changeStatut}
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

      <Text style={styles.section}>Pièces</Text>
      {pieces.map((p, index) => (
        <View key={`${index}-${p.nom}`} style={styles.pieceRow}>
          <TextInput
            style={[styles.pieceInput, { flex: 1.6 }]}
            value={p.nom}
            onChangeText={(nom) => updatePiece(index, { nom })}
            placeholder="Nom"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={styles.pieceInput}
            value={String(p.quantite)}
            onChangeText={(t) =>
              updatePiece(index, {
                quantite: parseFloat(t.replace(',', '.')) || 0,
              })
            }
            keyboardType="decimal-pad"
            placeholder="Qté"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={styles.pieceInput}
            value={p.prixUnitaire != null ? String(p.prixUnitaire) : ''}
            onChangeText={(t) =>
              updatePiece(index, {
                prixUnitaire: t
                  ? parseFloat(t.replace(',', '.')) || 0
                  : undefined,
              })
            }
            keyboardType="decimal-pad"
            placeholder="Prix"
            placeholderTextColor={Colors.textMuted}
          />
          <Pressable
            onPress={() => setPieces((prev) => prev.filter((_, i) => i !== index))}
          >
            <Text style={styles.remove}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() =>
          setPieces((prev) => [...prev, { nom: '', quantite: 1, prixUnitaire: 0 }])
        }
      >
        <Text style={styles.addLink}>+ Ajouter une pièce</Text>
      </Pressable>

      <PrimaryButton
        title={saving ? 'Enregistrement…' : 'Enregistrer travaux & pièces'}
        onPress={saveTravauxPieces}
        disabled={saving}
        variant="secondary"
      />

      <Text style={styles.section}>Devis & facture</Text>
      <View style={styles.docCard}>
        {devis ? (
          <Pressable onPress={() => router.push(`/devis/${devis.id}`)}>
            <View style={styles.row}>
              <Text style={styles.docNum}>{devis.numero}</Text>
              <DevisBadge statut={devis.statut} />
            </View>
            <Text style={styles.docAmt}>{formatMontant(devis.totalTTC)}</Text>
          </Pressable>
        ) : (
          <PrimaryButton title="Créer un devis" onPress={createDevis} />
        )}

        {devis?.statut === 'accepte' && !facture ? (
          <PrimaryButton
            title="Générer la facture"
            onPress={genererFacture}
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
        ) : !devis ? (
          <PrimaryButton
            title="Créer une facture directe"
            onPress={createFactureDirecte}
            variant="secondary"
          />
        ) : null}
      </View>
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
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  motif: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  section: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  textarea: {
    minHeight: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
  },
  pieceRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  pieceInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
  },
  remove: { color: Colors.danger, fontWeight: '700', padding: 6 },
  addLink: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  docNum: { fontWeight: '800', color: Colors.primary, fontSize: 15 },
  docAmt: { fontWeight: '700', color: Colors.text, marginTop: 4 },
});
