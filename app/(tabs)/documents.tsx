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
import { ChipSelect } from '@/components/Form';
import { DevisBadge, FactureBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { formatDate, formatMontant } from '@/utils/format';
import type { Devis, DocumentEnrichi, Facture } from '@/types';

type Tab = 'devis' | 'factures';
type DocRow =
  | ({ kind: 'devis' } & Devis & DocumentEnrichi)
  | ({ kind: 'facture' } & Facture & DocumentEnrichi);

export default function DocumentsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('devis');
  const [devis, setDevis] = useState<(Devis & DocumentEnrichi)[]>([]);
  const [factures, setFactures] = useState<(Facture & DocumentEnrichi)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState('tous');

  const load = useCallback(async () => {
    try {
      const [d, f] = await Promise.all([
        garageService.listDevis(),
        garageService.listFactures(),
      ]);
      setDevis(d);
      setFactures(f);
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

  const filtreOptions =
    tab === 'devis'
      ? [
          { value: 'tous', label: 'Tous' },
          { value: 'brouillon', label: 'Brouillon' },
          { value: 'envoye', label: 'Envoyé' },
          { value: 'accepte', label: 'Accepté' },
          { value: 'refuse', label: 'Refusé' },
        ]
      : [
          { value: 'tous', label: 'Tous' },
          { value: 'impayee', label: 'Impayée' },
          { value: 'payee', label: 'Payée' },
          { value: 'annulee', label: 'Annulée' },
        ];

  const data: DocRow[] = useMemo(() => {
    if (tab === 'devis') {
      const list =
        filtre === 'tous' ? devis : devis.filter((d) => d.statut === filtre);
      return list.map((d) => ({ ...d, kind: 'devis' as const }));
    }
    const list =
      filtre === 'tous'
        ? factures
        : factures.filter((f) => f.statut === filtre);
    return list.map((f) => ({ ...f, kind: 'facture' as const }));
  }, [tab, filtre, devis, factures]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'devis' && styles.tabActive]}
          onPress={() => {
            setTab('devis');
            setFiltre('tous');
          }}
        >
          <Text style={[styles.tabText, tab === 'devis' && styles.tabTextActive]}>
            Devis
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'factures' && styles.tabActive]}
          onPress={() => {
            setTab('factures');
            setFiltre('tous');
          }}
        >
          <Text
            style={[styles.tabText, tab === 'factures' && styles.tabTextActive]}
          >
            Factures
          </Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <ChipSelect
          options={filtreOptions}
          value={filtre}
          onChange={setFiltre}
        />
      </View>

      <FlatList
        data={data}
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
        ListEmptyComponent={<EmptyState message="Aucun document." />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            onPress={() =>
              router.push(
                item.kind === 'devis'
                  ? `/devis/${item.id}`
                  : `/facture/${item.id}`
              )
            }
          >
            <View style={styles.row}>
              <Text style={styles.numero}>{item.numero}</Text>
              {item.kind === 'devis' ? (
                <DevisBadge statut={item.statut} />
              ) : (
                <FactureBadge statut={item.statut} />
              )}
            </View>
            {item.kind === 'devis' ? (
              <Text style={styles.vehicle}>
                {item.type === 'initial' ? 'Initial' : 'Complémentaire'}
              </Text>
            ) : null}
            <Text style={styles.client}>{item.client.nom}</Text>
            <Text style={styles.vehicle}>
              {item.vehicule.plaque} · {item.vehicule.marque}{' '}
              {item.vehicule.modele}
            </Text>
            <View style={styles.row}>
              <Text style={styles.date}>
                {formatDate(
                  item.kind === 'devis' ? item.dateCreation : item.dateEmission
                )}
              </Text>
              <Text style={styles.montant}>{formatMontant(item.totalTTC)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.primarySoft,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  filters: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numero: { fontWeight: '800', color: Colors.primary, fontSize: 15 },
  client: { fontSize: 15, fontWeight: '600', color: Colors.text },
  vehicle: { fontSize: 13, color: Colors.textMuted },
  date: { fontSize: 13, color: Colors.textMuted },
  montant: { fontSize: 16, fontWeight: '800', color: Colors.text },
});
