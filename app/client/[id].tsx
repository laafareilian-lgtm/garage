import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/Form';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import type { Client, Vehicule } from '@/types';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [c, v] = await Promise.all([
        garageService.getClientById(id),
        garageService.listVehicules(id),
      ]);
      setClient(c);
      setVehicules(v);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (!client) return <EmptyState message="Client introuvable." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.nom}>{client.nom}</Text>
        <Text style={styles.tel}>{client.telephone}</Text>
        {client.email ? <Text style={styles.meta}>{client.email}</Text> : null}
        {client.adresse ? (
          <Text style={styles.meta}>{client.adresse}</Text>
        ) : null}
      </View>

      <Text style={styles.section}>Véhicules</Text>
      {vehicules.length === 0 ? (
        <Text style={styles.empty}>Aucun véhicule enregistré.</Text>
      ) : (
        vehicules.map((v) => (
          <Pressable
            key={v.id}
            style={styles.vehCard}
            onPress={() => router.push(`/vehicule/${v.id}`)}
          >
            <Text style={styles.plaque}>{v.plaque}</Text>
            <Text style={styles.vehName}>
              {v.marque} {v.modele}
              {v.annee ? ` (${v.annee})` : ''}
            </Text>
            {v.kilometrage != null ? (
              <Text style={styles.meta}>{v.kilometrage.toLocaleString('fr-BE')} km</Text>
            ) : null}
          </Pressable>
        ))
      )}

      <PrimaryButton
        title="Nouvelle entrée pour ce client"
        onPress={() =>
          router.push({
            pathname: '/nouvelle-entree',
            params: { clientId: client.id },
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  nom: { fontSize: 20, fontWeight: '800', color: Colors.text },
  tel: { fontSize: 15, color: Colors.accent, fontWeight: '600' },
  meta: { fontSize: 13, color: Colors.textMuted },
  section: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  empty: { color: Colors.textMuted },
  vehCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  plaque: { fontWeight: '800', color: Colors.primary, fontSize: 16 },
  vehName: { fontSize: 15, color: Colors.text, fontWeight: '600' },
});
