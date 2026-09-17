import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InterventionBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import type { InterventionEnrichie } from '@/types';

type Props = {
  item: InterventionEnrichie;
  onPress: () => void;
};

export function InterventionCard({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Text style={styles.plaque}>{item.vehicule.plaque}</Text>
        <InterventionBadge statut={item.statut} />
      </View>
      <Text style={styles.vehicle}>
        {item.vehicule.marque} {item.vehicule.modele}
      </Text>
      <Text style={styles.client}>{item.client.nom}</Text>
      <Text style={styles.meta}>
        Entrée {formatDate(item.dateEntree)}
        {item.motifDeclare ? ` · ${item.motifDeclare}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  pressed: { opacity: 0.9 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  plaque: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  vehicle: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  client: { fontSize: 14, color: Colors.textMuted },
  meta: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
