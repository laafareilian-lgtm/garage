import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChipSelect, FormField } from '@/components/Form';
import { Colors, NiveauCarburantOptions } from '@/constants/theme';
import type { EtatDesLieux, NiveauCarburant } from '@/types';

type Props = {
  value: {
    kilometrage: string;
    niveauCarburant: NiveauCarburant;
    degatsExistants: string;
    photos: string[];
  };
  onChange: (next: Props['value']) => void;
  title?: string;
};

export function EtatDesLieuxFields({ value, onChange, title }: Props) {
  function addPhoto() {
    const n = value.photos.length + 1;
    onChange({
      ...value,
      photos: [...value.photos, `mock://photo-${Date.now()}-${n}`],
    });
  }

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <FormField
        label="Kilométrage"
        value={value.kilometrage}
        onChangeText={(kilometrage) => onChange({ ...value, kilometrage })}
        placeholder="78500"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Niveau de carburant</Text>
      <ChipSelect
        options={NiveauCarburantOptions}
        value={value.niveauCarburant}
        onChange={(v) =>
          onChange({ ...value, niveauCarburant: v as NiveauCarburant })
        }
      />
      <FormField
        label="Dégâts existants"
        value={value.degatsExistants}
        onChangeText={(degatsExistants) =>
          onChange({ ...value, degatsExistants })
        }
        placeholder="Rayures, chocs…"
        multiline
      />
      <Text style={styles.label}>Photos</Text>
      <View style={styles.photos}>
        {value.photos.map((p) => (
          <View key={p} style={styles.photo}>
            <Text style={styles.photoText} numberOfLines={1}>
              📷 {p.replace('mock://', '')}
            </Text>
          </View>
        ))}
      </View>
      <Pressable onPress={addPhoto}>
        <Text style={styles.addPhoto}>+ Ajouter une photo (mock)</Text>
      </Pressable>
    </View>
  );
}

export function EtatDesLieuxLecture({
  etat,
  title,
}: {
  etat: EtatDesLieux;
  title: string;
}) {
  const carburant =
    NiveauCarburantOptions.find((o) => o.value === etat.niveauCarburant)
      ?.label ?? etat.niveauCarburant;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.line}>
        {etat.kilometrage.toLocaleString('fr-BE')} km · Carburant {carburant}
      </Text>
      <Text style={styles.meta}>Le {etat.date}</Text>
      {etat.degatsExistants ? (
        <Text style={styles.line}>{etat.degatsExistants}</Text>
      ) : (
        <Text style={styles.meta}>Aucun dégât noté</Text>
      )}
      {etat.photos && etat.photos.length > 0 ? (
        <Text style={styles.meta}>{etat.photos.length} photo(s) mock</Text>
      ) : null}
    </View>
  );
}

export function buildEtatDesLieux(
  value: Props['value'],
  date: string
): EtatDesLieux | null {
  const km = parseInt(value.kilometrage.replace(/\s/g, ''), 10);
  if (Number.isNaN(km)) return null;
  return {
    kilometrage: km,
    niveauCarburant: value.niveauCarburant,
    degatsExistants: value.degatsExistants.trim() || undefined,
    photos: value.photos.length ? value.photos : undefined,
    date,
  };
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  photos: { gap: 6 },
  photo: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 8,
    padding: 10,
  },
  photoText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  addPhoto: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  line: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  meta: { fontSize: 13, color: Colors.textMuted },
});
