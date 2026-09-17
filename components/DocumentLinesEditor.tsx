import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { calculerTotaux, recalculerLigne } from '@/utils/calculs';
import { formatMontant } from '@/utils/format';
import type { LigneDocument } from '@/types';

type Props = {
  lignes: LigneDocument[];
  onChange: (lignes: LigneDocument[]) => void;
};

export function DocumentLinesEditor({ lignes, onChange }: Props) {
  const totaux = calculerTotaux(lignes);

  function update(index: number, patch: Partial<LigneDocument>) {
    const next = lignes.map((l, i) => {
      if (i !== index) return l;
      return recalculerLigne({ ...l, ...patch });
    });
    onChange(next);
  }

  function remove(index: number) {
    onChange(lignes.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...lignes,
      recalculerLigne({
        id: `ligne-${Date.now()}`,
        description: '',
        quantite: 1,
        prixUnitaireHT: 0,
        tvaPct: 21,
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
      }),
    ]);
  }

  return (
    <View style={styles.wrap}>
      {lignes.map((l, index) => (
        <View key={l.id} style={styles.line}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineTitle}>Ligne {index + 1}</Text>
            <Pressable onPress={() => remove(index)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={l.description}
            onChangeText={(description) => update(index, { description })}
            placeholder="Description"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.row3}>
            <View style={styles.col}>
              <Text style={styles.mini}>Qté</Text>
              <TextInput
                style={styles.input}
                value={String(l.quantite)}
                onChangeText={(t) =>
                  update(index, { quantite: parseFloat(t.replace(',', '.')) || 0 })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.col, { flex: 1.4 }]}>
              <Text style={styles.mini}>P.U. HT</Text>
              <TextInput
                style={styles.input}
                value={String(l.prixUnitaireHT)}
                onChangeText={(t) =>
                  update(index, {
                    prixUnitaireHT: parseFloat(t.replace(',', '.')) || 0,
                  })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.mini}>TVA %</Text>
              <TextInput
                style={styles.input}
                value={String(l.tvaPct)}
                onChangeText={(t) =>
                  update(index, { tvaPct: parseFloat(t.replace(',', '.')) || 0 })
                }
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Text style={styles.lineTotal}>TTC {formatMontant(l.totalTTC)}</Text>
        </View>
      ))}

      <Pressable onPress={add} style={styles.addBtn}>
        <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
        <Text style={styles.addText}>Ajouter une ligne</Text>
      </Pressable>

      <View style={styles.totals}>
        <Row label="Sous-total HT" value={formatMontant(totaux.sousTotalHT)} />
        <Row label="Total TVA" value={formatMontant(totaux.totalTVA)} />
        <Row label="Total TTC" value={formatMontant(totaux.totalTTC)} bold />
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  line: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 8,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineTitle: { fontWeight: '700', color: Colors.text, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  row3: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, gap: 4 },
  mini: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  lineTotal: {
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addText: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  totals: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { color: Colors.text, fontSize: 14 },
  totalValue: { color: Colors.text, fontSize: 14 },
  bold: { fontWeight: '800', fontSize: 16, color: Colors.primary },
});
