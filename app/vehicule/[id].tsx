import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/Form';
import { InterventionBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { formatDate } from '@/utils/format';
import type { Client, InterventionEnrichie, Vehicule } from '@/types';

export default function VehiculeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicule, setVehicule] = useState<(Vehicule & { client: Client }) | null>(
    null
  );
  const [interventions, setInterventions] = useState<InterventionEnrichie[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [v, ints] = await Promise.all([
        garageService.getVehiculeById(id),
        garageService.listInterventions(id),
      ]);
      setVehicule(v);
      setInterventions(ints);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingState />;
  if (!vehicule) return <EmptyState message="Véhicule introuvable." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.plaque}>{vehicule.plaque}</Text>
        <Text style={styles.name}>
          {vehicule.marque} {vehicule.modele}
          {vehicule.annee ? ` · ${vehicule.annee}` : ''}
        </Text>
        {vehicule.kilometrage != null ? (
          <Text style={styles.meta}>
            {vehicule.kilometrage.toLocaleString('fr-BE')} km
          </Text>
        ) : null}
        {vehicule.vin ? (
          <Text style={styles.meta}>VIN {vehicule.vin}</Text>
        ) : null}
        <Pressable onPress={() => router.push(`/client/${vehicule.clientId}`)}>
          <Text style={styles.client}>{vehicule.client.nom}</Text>
          <Text style={styles.meta}>{vehicule.client.telephone}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Historique</Text>

      <FlatList
        data={interventions}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="Aucune intervention pour ce véhicule." />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <PrimaryButton
              title="Nouvelle intervention"
              onPress={() =>
                router.push({
                  pathname: '/nouvelle-entree',
                  params: {
                    clientId: vehicule.clientId,
                    vehiculeId: vehicule.id,
                  },
                })
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/intervention/${item.id}`)}
          >
            <View style={styles.row}>
              <Text style={styles.date}>{formatDate(item.dateEntree)}</Text>
              <InterventionBadge statut={item.statut} />
            </View>
            <Text style={styles.motif} numberOfLines={2}>
              {item.motifDeclare}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  plaque: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted },
  client: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },
  section: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontWeight: '700', color: Colors.text },
  motif: { color: Colors.textMuted, fontSize: 14 },
  footer: { marginTop: 8 },
});
