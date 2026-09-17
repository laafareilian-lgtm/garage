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
import { SearchBar } from '@/components/SearchBar';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import type { Client } from '@/types';

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setClients(await garageService.listClients());
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
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.telephone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [clients, query]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Nom ou téléphone…"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
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
        ListEmptyComponent={<EmptyState message="Aucun client." />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            onPress={() => router.push(`/client/${item.id}`)}
          >
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.tel}>{item.telephone}</Text>
            {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 8, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  nom: { fontSize: 16, fontWeight: '700', color: Colors.text },
  tel: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  meta: { fontSize: 13, color: Colors.textMuted },
});
