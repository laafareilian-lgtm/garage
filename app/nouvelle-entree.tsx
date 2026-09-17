import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  buildEtatDesLieux,
  EtatDesLieuxFields,
} from '@/components/EtatDesLieuxFields';
import { ChipSelect, FormField, PrimaryButton } from '@/components/Form';
import { LoadingState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { garageService } from '@/data/garageService';
import { todayISO } from '@/utils/format';
import type { Client, NiveauCarburant, Vehicule } from '@/types';

export default function NouvelleEntreeScreen() {
  const router = useRouter();
  const { clientId: presetClientId, vehiculeId: presetVehiculeId } =
    useLocalSearchParams<{ clientId?: string; vehiculeId?: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);

  const [modeClient, setModeClient] = useState<'select' | 'create'>('select');
  const [modeVehicule, setModeVehicule] = useState<'select' | 'create'>(
    'select'
  );

  const [clientId, setClientId] = useState(presetClientId ?? '');
  const [vehiculeId, setVehiculeId] = useState(presetVehiculeId ?? '');

  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauTel, setNouveauTel] = useState('');
  const [plaque, setPlaque] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [kilometrageVeh, setKilometrageVeh] = useState('');
  const [motifDeclare, setMotifDeclare] = useState('');
  const [dateEntree, setDateEntree] = useState(todayISO());
  const [dateSortiePrevue, setDateSortiePrevue] = useState('');

  const [etat, setEtat] = useState({
    kilometrage: '',
    niveauCarburant: '1/2' as NiveauCarburant,
    degatsExistants: '',
    photos: [] as string[],
  });

  const [piecesACommander, setPiecesACommander] = useState<
    { key: string; nom: string; fournisseur: string; prix: string }[]
  >([]);

  function addPieceRow() {
    setPiecesACommander((prev) => [
      ...prev,
      {
        key: `p-${Date.now()}-${prev.length}`,
        nom: '',
        fournisseur: '',
        prix: '',
      },
    ]);
  }

  function updatePieceRow(
    key: string,
    patch: Partial<{ nom: string; fournisseur: string; prix: string }>
  ) {
    setPiecesACommander((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
  }

  function removePieceRow(key: string) {
    setPiecesACommander((prev) => prev.filter((p) => p.key !== key));
  }

  const load = useCallback(async () => {
    try {
      const c = await garageService.listClients();
      setClients(c);
      if (presetClientId) {
        const v = await garageService.listVehicules(presetClientId);
        setVehicules(v);
        setClientId(presetClientId);
      } else if (presetVehiculeId) {
        const veh = await garageService.getVehiculeById(presetVehiculeId);
        if (veh) {
          setClientId(veh.clientId);
          setVehiculeId(veh.id);
          if (veh.kilometrage != null) {
            setEtat((e) => ({ ...e, kilometrage: String(veh.kilometrage) }));
          }
          const v = await garageService.listVehicules(veh.clientId);
          setVehicules(v);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [presetClientId, presetVehiculeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!clientId || modeClient === 'create') {
      setVehicules([]);
      return;
    }
    garageService.listVehicules(clientId).then(setVehicules);
  }, [clientId, modeClient]);

  async function onSave() {
    if (!motifDeclare.trim()) {
      Alert.alert('Motif requis', 'Indiquez le motif déclaré par le client.');
      return;
    }
    if (!dateEntree.trim()) {
      Alert.alert('Date requise', 'Indiquez la date d’entrée.');
      return;
    }
    const etatEntree = buildEtatDesLieux(etat, dateEntree.trim());
    if (!etatEntree) {
      Alert.alert(
        'État des lieux',
        'Le kilométrage est obligatoire pour l’état d’entrée.'
      );
      return;
    }

    setSaving(true);
    try {
      let cid = clientId;
      if (modeClient === 'create') {
        if (!nouveauNom.trim() || !nouveauTel.trim()) {
          Alert.alert('Client', 'Nom et téléphone sont requis.');
          setSaving(false);
          return;
        }
        const created = await garageService.createClient({
          nom: nouveauNom.trim(),
          telephone: nouveauTel.trim(),
        });
        cid = created.id;
      }
      if (!cid) {
        Alert.alert('Client', 'Sélectionnez ou créez un client.');
        setSaving(false);
        return;
      }

      let vid = vehiculeId;
      if (modeVehicule === 'create') {
        if (!plaque.trim() || !marque.trim() || !modele.trim()) {
          Alert.alert('Véhicule', 'Plaque, marque et modèle sont requis.');
          setSaving(false);
          return;
        }
        const created = await garageService.createVehicule({
          clientId: cid,
          plaque: plaque.trim().toUpperCase(),
          marque: marque.trim(),
          modele: modele.trim(),
          kilometrage: kilometrageVeh
            ? parseInt(kilometrageVeh.replace(/\s/g, ''), 10)
            : etatEntree.kilometrage,
        });
        vid = created.id;
      }
      if (!vid) {
        Alert.alert('Véhicule', 'Sélectionnez ou créez un véhicule.');
        setSaving(false);
        return;
      }

      const intervention = await garageService.createIntervention({
        vehiculeId: vid,
        motifDeclare: motifDeclare.trim(),
        dateEntree: dateEntree.trim(),
        dateSortiePrevue: dateSortiePrevue.trim() || undefined,
        etatEntree,
        piecesACommander: piecesACommander
          .filter((p) => p.nom.trim())
          .map((p) => ({
            nom: p.nom.trim(),
            fournisseur: p.fournisseur.trim() || undefined,
            prixUnitaireEstime: p.prix
              ? parseFloat(p.prix.replace(',', '.')) || undefined
              : undefined,
          })),
      });

      router.replace(`/intervention/${intervention.id}`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.section}>Client</Text>
      <ChipSelect
        options={[
          { value: 'select', label: 'Existant' },
          { value: 'create', label: 'Nouveau' },
        ]}
        value={modeClient}
        onChange={(v) => {
          setModeClient(v as 'select' | 'create');
          setVehiculeId('');
        }}
      />
      {modeClient === 'select' ? (
        <View style={styles.pickerList}>
          {clients.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setClientId(c.id);
                setVehiculeId('');
              }}
              style={[styles.pick, clientId === c.id && styles.pickActive]}
            >
              <Text
                style={[
                  styles.pickText,
                  clientId === c.id && styles.pickTextActive,
                ]}
              >
                {c.nom}
              </Text>
              <Text style={styles.pickSub}>{c.telephone}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.fields}>
          <FormField
            label="Nom"
            value={nouveauNom}
            onChangeText={setNouveauNom}
            placeholder="Nom du client"
            autoCapitalize="words"
          />
          <FormField
            label="Téléphone"
            value={nouveauTel}
            onChangeText={setNouveauTel}
            placeholder="04xx xx xx xx"
            keyboardType="phone-pad"
          />
        </View>
      )}

      <Text style={styles.section}>Véhicule</Text>
      <ChipSelect
        options={[
          { value: 'select', label: 'Existant' },
          { value: 'create', label: 'Nouveau' },
        ]}
        value={modeVehicule}
        onChange={(v) => setModeVehicule(v as 'select' | 'create')}
      />
      {modeVehicule === 'select' ? (
        <View style={styles.pickerList}>
          {vehicules.length === 0 ? (
            <Text style={styles.hint}>
              {clientId || modeClient === 'create'
                ? 'Aucun véhicule pour ce client — créez-en un.'
                : 'Choisissez d’abord un client.'}
            </Text>
          ) : (
            vehicules.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => {
                  setVehiculeId(v.id);
                  if (v.kilometrage != null && !etat.kilometrage) {
                    setEtat((e) => ({
                      ...e,
                      kilometrage: String(v.kilometrage),
                    }));
                  }
                }}
                style={[styles.pick, vehiculeId === v.id && styles.pickActive]}
              >
                <Text
                  style={[
                    styles.pickText,
                    vehiculeId === v.id && styles.pickTextActive,
                  ]}
                >
                  {v.plaque}
                </Text>
                <Text style={styles.pickSub}>
                  {v.marque} {v.modele}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : (
        <View style={styles.fields}>
          <FormField
            label="Plaque"
            value={plaque}
            onChangeText={setPlaque}
            placeholder="1-ABC-123"
            autoCapitalize="characters"
          />
          <FormField
            label="Marque"
            value={marque}
            onChangeText={setMarque}
            placeholder="Volkswagen"
            autoCapitalize="words"
          />
          <FormField
            label="Modèle"
            value={modele}
            onChangeText={setModele}
            placeholder="Golf"
            autoCapitalize="words"
          />
          <FormField
            label="Kilométrage véhicule"
            value={kilometrageVeh}
            onChangeText={setKilometrageVeh}
            placeholder="78500"
            keyboardType="numeric"
          />
        </View>
      )}

      <Text style={styles.section}>Intervention</Text>
      <View style={styles.fields}>
        <FormField
          label="Motif déclaré par le client"
          value={motifDeclare}
          onChangeText={setMotifDeclare}
          placeholder="Ce que le client décrit en arrivant"
          multiline
        />
        <Text style={styles.hint}>
          Le diagnostic garagiste se remplit plus tard sur la fiche intervention.
        </Text>
        <FormField
          label="Date d’entrée (AAAA-MM-JJ)"
          value={dateEntree}
          onChangeText={setDateEntree}
          placeholder={todayISO()}
          autoCapitalize="none"
        />
        <FormField
          label="Sortie prévue (optionnel)"
          value={dateSortiePrevue}
          onChangeText={setDateSortiePrevue}
          placeholder="AAAA-MM-JJ"
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.section}>État des lieux à l’entrée</Text>
      <EtatDesLieuxFields value={etat} onChange={setEtat} />

      <Text style={styles.section}>Pièces à commander (optionnel)</Text>
      <Text style={styles.hint}>
        Si tu sais déjà qu’il faudra une pièce, ajoute-la ici — elle apparaîtra
        dans le suivi des pièces.
      </Text>
      {piecesACommander.map((p) => (
        <View key={p.key} style={styles.pieceCard}>
          <FormField
            label="Nom de la pièce"
            value={p.nom}
            onChangeText={(nom) => updatePieceRow(p.key, { nom })}
            placeholder="Filtre à huile, plaquettes…"
          />
          <FormField
            label="Fournisseur"
            value={p.fournisseur}
            onChangeText={(fournisseur) =>
              updatePieceRow(p.key, { fournisseur })
            }
            placeholder="Optionnel"
          />
          <FormField
            label="Prix estimé"
            value={p.prix}
            onChangeText={(prix) => updatePieceRow(p.key, { prix })}
            placeholder="0"
            keyboardType="decimal-pad"
          />
          <Pressable onPress={() => removePieceRow(p.key)}>
            <Text style={styles.remove}>Retirer</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addPieceRow}>
        <Text style={styles.addLink}>+ Ajouter une pièce à commander</Text>
      </Pressable>

      <PrimaryButton
        title={saving ? 'Enregistrement…' : 'Enregistrer'}
        onPress={onSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  section: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fields: { gap: 12 },
  pickerList: { gap: 8 },
  pick: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
  },
  pickActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  pickText: { fontWeight: '700', color: Colors.text, fontSize: 15 },
  pickTextActive: { color: Colors.primary },
  pickSub: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  hint: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  pieceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 10,
  },
  addLink: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  remove: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
});
