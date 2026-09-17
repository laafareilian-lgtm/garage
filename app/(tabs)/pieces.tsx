import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { PieceBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { formatDate, formatMontant } from '@/utils/format';
import type { PieceCommandeeEnrichie } from '@/types';

export default function PiecesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PieceCommandeeEnrichie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await garageService.listPiecesCommandees();
      setItems(
        all.filter((p) => p.statut === 'a_commander' || p.statut === 'commandee')
      );
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

  const sections = useMemo(() => {
    const aCommander = items.filter((p) => p.statut === 'a_commander');
    const commandees = items.filter((p) => p.statut === 'commandee');
    return [
      ...(aCommander.length
        ? [{ title: 'À commander', data: aCommander }]
        : []),
      ...(commandees.length
        ? [{ title: 'Commandées', data: commandees }]
        : []),
    ];
  }, [items]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
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
          <EmptyState message="Aucune pièce en attente de commande ou de livraison." />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/intervention/${item.interventionId}`)}
          >
            <View style={styles.row}>
              <Text style={styles.nom}>{item.nom}</Text>
              <PieceBadge statut={item.statut} />
            </View>
            <Text style={styles.vehicle}>
              {item.vehicule.plaque} · {item.client.nom}
            </Text>
            {item.fournisseur ? (
              <Text style={styles.meta}>{item.fournisseur}</Text>
            ) : null}
            <Text style={styles.meta}>
              {item.dateLivraisonPrevue
                ? `Livraison prévue ${formatDate(item.dateLivraisonPrevue)}`
                : item.dateCommande
                  ? `Commandée le ${formatDate(item.dateCommande)}`
                  : 'Pas encore commandée'}
              {item.prixUnitaireEstime != null
                ? ` · ~${formatMontant(item.prixUnitaireEstime)}`
                : ''}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nom: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  vehicle: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  meta: { fontSize: 13, color: Colors.textMuted },
});
