import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { formatDate, todayISO } from '@/utils/format';
import type { RappelEnrichi } from '@/types';

export default function RappelsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RappelEnrichi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await garageService.listRappelsAVenir());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingState />;

  const today = todayISO();

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.intervention.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <EmptyState message="Aucun rappel d’entretien enregistré." />
        }
        renderItem={({ item }) => {
          const overdue = item.dateRappel < today;
          return (
            <Pressable
              style={[styles.card, overdue && styles.overdue]}
              onPress={() =>
                router.push(`/vehicule/${item.intervention.vehiculeId}`)
              }
            >
              <View style={styles.row}>
                <Text style={styles.date}>{formatDate(item.dateRappel)}</Text>
                {overdue ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Dépassé</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.motif}>{item.motif}</Text>
              <Text style={styles.vehicle}>
                {item.intervention.vehicule.plaque} ·{' '}
                {item.intervention.vehicule.marque}{' '}
                {item.intervention.vehicule.modele}
              </Text>
              <Text style={styles.client}>{item.intervention.client.nom}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  overdue: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  motif: { fontSize: 15, fontWeight: '600', color: Colors.text },
  vehicle: { fontSize: 14, color: Colors.textMuted },
  client: { fontSize: 13, color: Colors.textMuted },
});
