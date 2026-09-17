import { useCallback, useMemo, useState } from 'react';
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
import { FabButton } from '@/components/FabButton';
import { InterventionCard } from '@/components/InterventionCard';
import { SearchBar } from '@/components/SearchBar';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import type { InterventionEnrichie } from '@/types';

export default function AccueilScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InterventionEnrichie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await garageService.listInterventionsActives();
      setItems(data);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.vehicule.plaque.toLowerCase().includes(q) ||
        i.client.nom.toLowerCase().includes(q) ||
        `${i.vehicule.marque} ${i.vehicule.modele}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Véhicules au garage</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Plaque ou nom client…"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState message="Aucun véhicule au garage pour le moment." />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <InterventionCard
              item={item}
              onPress={() => router.push(`/intervention/${item.id}`)}
            />
            <Pressable
              onPress={() => router.push(`/vehicule/${item.vehiculeId}`)}
              style={styles.link}
            >
              <Text style={styles.linkText}>Fiche véhicule →</Text>
            </Pressable>
          </View>
        )}
      />

      <FabButton onPress={() => router.push('/nouvelle-entree')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, paddingBottom: 8, gap: 12 },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: { padding: 16, paddingTop: 8, paddingBottom: 100, gap: 12 },
  cardWrap: { gap: 4 },
  link: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 4 },
  linkText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
});
