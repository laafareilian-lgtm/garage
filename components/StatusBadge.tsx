import { StyleSheet, Text, View } from 'react-native';
import {
  DevisStatutMeta,
  FactureStatutMeta,
  InterventionStatutMeta,
  StatusColors,
  type StatusTone,
} from '@/constants/theme';
import type { DevisStatut, FactureStatut, InterventionStatut } from '@/types';

type Props = {
  label: string;
  tone: StatusTone;
};

export function StatusBadge({ label, tone }: Props) {
  const c = StatusColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function InterventionBadge({ statut }: { statut: InterventionStatut }) {
  const meta = InterventionStatutMeta[statut];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function DevisBadge({ statut }: { statut: DevisStatut }) {
  const meta = DevisStatutMeta[statut];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function FactureBadge({ statut }: { statut: FactureStatut }) {
  const meta = FactureStatutMeta[statut];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
