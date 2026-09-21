import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { VenueLocationChooser } from '../../components/VenueLocationChooser';
import { useProfileStore } from '../../state/profileStore';
import { useAvatarStore } from '../../state/avatarStore';
import { announceAvatarChange, announceProfileUpdate } from '../../mesh/meshController';
import {
  ensureNotificationPermission,
  getNotificationPermission,
  notificationsSupported,
  type NotificationPermission,
} from '../../notifications/notifier';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { defaultLocation } from '../../utils/location';

import type { UserLocation } from '../../types';

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
  const [location, setLocation] = useState<UserLocation>(profile?.location ?? defaultLocation('plane'));
  const [notifications, setNotifications] = useState<NotificationPermission>('undetermined');
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing(3) },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    backLink: { color: colors.text, fontWeight: '600' as const },
    headerSpacer: { width: 60 },
    title: typography.title,
    photoBlock: {
      alignItems: 'center' as const,
      gap: spacing(1.5),
      marginTop: spacing(3),
      marginBottom: spacing(1),
    },
    // The two photo actions belong together and to the photo, so they sit on
    // one line under it. Stacked, "Quitar" drifted down into the venue chips
    // and read as if it belonged to them.
    photoActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1.5) },
    photoAction: { color: colors.accent, fontWeight: '700' as const },
    photoActionDivider: { color: colors.textMuted, fontSize: 13 },
    photoRemove: { ...typography.subtitle, fontSize: 13 },
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(2),
      marginTop: spacing(3),
      gap: spacing(0.5),
    },
    cardTitle: { ...typography.body, fontWeight: '700' as const },
    cardBody: { ...typography.subtitle, fontSize: 13 },
    cardAction: { color: colors.accent, fontWeight: '700' as const, marginTop: spacing(1) },
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

  useFocusEffect(
    useCallback(() => {
      // Re-read every time: the user may have just changed it in Settings.
      void getNotificationPermission().then(setNotifications);
    }, []),
  );

  const handleNotifications = async () => {
    if (notifications === 'denied') {
      // iOS only ever asks once; after a no, Settings is the only way back.
      await Linking.openSettings();
      return;
    }
    await ensureNotificationPermission();
    setNotifications(await getNotificationPermission());
  };

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
    void announceAvatarChange();
  };

  const handleRemovePhoto = async () => {
    await setMyAvatar(null);
    void announceAvatarChange();
  };

  const handleSave = async () => {
    if (!canSave) return;
    const updated = { nickname: nickname.trim(), location, contact: contact.trim() || undefined };
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
          <Avatar nickname={nickname} size={88} zoomable />
          <View style={styles.photoActions}>
            <Pressable onPress={handlePickPhoto} hitSlop={8}>
              <Text style={styles.photoAction}>{myAvatar ? 'Cambiar foto' : 'Añadir foto'}</Text>
            </Pressable>
            {myAvatar !== null && (
              <>
                <Text style={styles.photoActionDivider}>·</Text>
                <Pressable onPress={handleRemovePhoto} hitSlop={8}>
                  <Text style={styles.photoRemove}>Quitar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <VenueLocationChooser location={location} onChange={setLocation} />

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

        {notificationsSupported && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Avisos</Text>
            <Text style={styles.cardBody}>
              {notifications === 'granted'
                ? 'Te avisamos de los mensajes privados que lleguen con la app en segundo plano. Si cierras la app del todo, el Bluetooth se apaga y no llega nada.'
                : 'Activa los avisos para enterarte de los mensajes privados aunque no tengas la app en pantalla.'}
            </Text>
            {notifications !== 'granted' && (
              <Pressable onPress={handleNotifications}>
                <Text style={styles.cardAction}>
                  {notifications === 'denied' ? 'Abrir Ajustes' : 'Activar avisos'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

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
