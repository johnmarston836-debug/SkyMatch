import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useProfileStore } from '../../state/profileStore';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

const INTEREST_OPTIONS = ['Viajar', 'Música', 'Series', 'Deporte', 'Foodie', 'Lectura', 'Fotografía', 'Tech'];

export function ProfileSetupScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const save = useProfileStore((state) => state.save);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest],
    );
  };

  const canContinue = name.trim().length > 0 && Number(age) >= 18;

  const handleContinue = async () => {
    if (!canContinue) return;
    await save({ name: name.trim(), age: Number(age), bio: bio.trim(), interests, seat: route.params.seat });
    navigation.getParent()?.navigate('Main');
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + spacing(4) }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing(4) }}
    >
      <Text style={typography.label}>PASO 2 DE 2</Text>
      <Text style={[typography.title, styles.title]}>Tu perfil de vuelo</Text>

      <Text style={styles.fieldLabel}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="¿Cómo te llamas?"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>Edad</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="18+"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
      />

      <Text style={styles.fieldLabel}>Sobre ti</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="Una frase para romper el hielo a 10.000 metros"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={140}
      />

      <Text style={styles.fieldLabel}>Intereses</Text>
      <View style={styles.chipsRow}>
        {INTEREST_OPTIONS.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <Pressable
              key={interest}
              onPress={() => toggleInterest(interest)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{interest}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={[styles.cta, !canContinue && styles.ctaDisabled]} disabled={!canContinue} onPress={handleContinue}>
        <Text style={styles.ctaText}>Despegar 🛫</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  title: { marginTop: spacing(1), marginBottom: spacing(3) },
  fieldLabel: { ...typography.label, marginBottom: spacing(1), marginTop: spacing(2) },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 15,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { color: colors.textMuted, fontWeight: '600' },
  chipTextSelected: { color: colors.background },
  cta: {
    marginTop: spacing(4),
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
