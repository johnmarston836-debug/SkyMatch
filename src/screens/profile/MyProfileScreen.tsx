import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { SeatMap } from '../../components/SeatMap';
import { useProfileStore } from '../../state/profileStore';
import { useAvatarStore } from '../../state/avatarStore';
import { announceProfileUpdate, sendMyAvatar } from '../../mesh/meshController';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatSeat } from '../../utils/seat';
import type { Seat } from '../../types';

/** ~12 KB of base64 is already ~150 Bluetooth frames; past that the cabin notices. */
const MAX_AVATAR_CHARS = 12_000;

type Props = NativeStackScreenProps<MainStackParamList, 'MyProfile'>;

/** Your own profile: change seat mid-flight, fix your name, add or remove the contact you share. */
export function MyProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const profile = useProfileStore((state) => state.profile);
  const save = useProfileStore((state) => state.save);
  const myAvatar = useAvatarStore((state) => state.myAvatar);
  const setMyAvatar = useAvatarStore((state) => state.setMyAvatar);
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [contact, setContact] = useState(profile?.contact ?? '');
  const [seat, setSeat] = useState<Seat>(profile?.seat ?? { row: 14, letter: 'A' });
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing(3) },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    backLink: { color: colors.text, fontWeight: '600' as const },
    headerSpacer: { width: 60 },
    title: typography.title,
    photoBlock: { alignItems: 'center' as const, gap: spacing(1), marginTop: spacing(3) },
    photoAction: { color: colors.accent, fontWeight: '700' as const },
    photoRemove: { ...typography.subtitle, fontSize: 13 },
    seatReadout: { alignItems: 'center' as const, marginTop: spacing(2), marginBottom: spacing(2) },
    seatReadoutText: { color: colors.text, fontSize: 44, fontWeight: '800' as const, letterSpacing: 1 },
    fieldLabel: { ...typography.label, marginTop: spacing(2), marginBottom: spacing(1) },
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
    hint: { ...typography.subtitle, fontSize: 12, marginTop: spacing(1) },
    secondaryLink: {
      marginTop: spacing(3),
      paddingVertical: spacing(1.5),
      alignItems: 'center' as const,
    },
    secondaryLinkText: { ...typography.body, fontWeight: '700' as const },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
      marginTop: spacing(3),
    },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  const canSave = nickname.trim().length > 0;

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      // Tiny on purpose: the photo crosses the cabin in ~80-byte Bluetooth
      // frames, so every kilobyte is hundreds of them.
      maxWidth: 128,
      maxHeight: 128,
      quality: 0.4,
    });
    const asset = result.assets?.[0];
    if (!asset?.base64) return;
    if (asset.base64.length > MAX_AVATAR_CHARS) {
      Alert.alert('Foto demasiado grande', 'Prueba con otra imagen: por Bluetooth solo caben fotos muy pequeñas.');
      return;
    }
    await setMyAvatar(asset.base64);
    void sendMyAvatar();
  };

  const handleRemovePhoto = async () => {
    await setMyAvatar(null);
  };

  const handleSave = async () => {
    if (!canSave) return;
    const updated = { nickname: nickname.trim(), seat, contact: contact.trim() || undefined };
    await save(updated);
    const saved = useProfileStore.getState().profile;
    if (saved) await announceProfileUpdate(saved);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + theme.spacing(2), paddingBottom: insets.bottom + theme.spacing(4) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Mi perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.photoBlock}>
          <Avatar nickname={nickname} size={88} />
          <Pressable onPress={handlePickPhoto}>
            <Text style={styles.photoAction}>{myAvatar ? 'Cambiar foto' : 'Añadir foto'}</Text>
          </Pressable>
          {myAvatar !== null && (
            <Pressable onPress={handleRemovePhoto}>
              <Text style={styles.photoRemove}>Quitar</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.seatReadout}>
          <Text style={styles.seatReadoutText}>{formatSeat(seat)}</Text>
        </View>

        <SeatMap seat={seat} onChange={setSeat} />

        <Text style={styles.fieldLabel}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Tu nombre o apodo"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={24}
        />

        <Text style={styles.fieldLabel}>INSTAGRAM / WHATSAPP (OPCIONAL)</Text>
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder="@tuusuario o tu número"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={40}
        />
        <Text style={styles.hint}>
          Solo lo verá quien abra tu ficha o un chat privado contigo. Déjalo en blanco para no compartirlo.
        </Text>

        <Pressable style={[styles.cta, !canSave && styles.ctaDisabled]} disabled={!canSave} onPress={handleSave}>
          <Text style={styles.ctaText}>Guardar cambios</Text>
        </Pressable>

        <Pressable style={styles.secondaryLink} onPress={() => navigation.navigate('HowItWorks')}>
          <Text style={styles.secondaryLinkText}>Cómo funciona SkyMatch</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
