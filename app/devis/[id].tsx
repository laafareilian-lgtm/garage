import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { DocumentLinesEditor } from '@/components/DocumentLinesEditor';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { ChipSelect, PrimaryButton } from '@/components/Form';
import { DevisBadge } from '@/components/StatusBadge';
import { Colors, DevisStatutMeta } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { formatDate } from '@/utils/format';
import type { Devis, DevisStatut, DocumentEnrichi, LigneDocument } from '@/types';

export default function DevisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<(Devis & DocumentEnrichi) | null>(null);
  const [lignes, setLignes] = useState<LigneDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await garageService.getDevisById(id);
      setDoc(d);
      setLignes(d?.lignes ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function save() {
    if (!doc) return;
    setSaving(true);
    try {
      await garageService.updateDevis(doc.id, { lignes });
      Alert.alert('Enregistré', 'Devis mis à jour.');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatut(statut: string) {
    if (!doc) return;
    try {
      await garageService.updateDevisStatut(doc.id, statut as DevisStatut);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  }

  if (loading) return <LoadingState />;
  if (!doc) return <EmptyState message="Devis introuvable." />;

  const statutOptions = Object.entries(DevisStatutMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.numero}>{doc.numero}</Text>
          <DevisBadge statut={doc.statut} />
        </View>
        <Text style={styles.meta}>Créé le {formatDate(doc.dateCreation)}</Text>
        {doc.dateValidite ? (
          <Text style={styles.meta}>
            Validité {formatDate(doc.dateValidite)}
          </Text>
        ) : null}
        <Text style={styles.client}>{doc.client.nom}</Text>
        <Text style={styles.meta}>
          {doc.vehicule.plaque} · {doc.vehicule.marque} {doc.vehicule.modele}
        </Text>
      </View>

      <Text style={styles.section}>Statut</Text>
      <ChipSelect
        options={statutOptions}
        value={doc.statut}
        onChange={changeStatut}
      />

      <Text style={styles.section}>Lignes</Text>
      <DocumentLinesEditor lignes={lignes} onChange={setLignes} />

      <PrimaryButton
        title={saving ? 'Enregistrement…' : 'Enregistrer le devis'}
        onPress={save}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  header: {
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
  },
  numero: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  meta: { fontSize: 13, color: Colors.textMuted },
  client: { marginTop: 6, fontSize: 15, fontWeight: '700', color: Colors.text },
  section: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
});
