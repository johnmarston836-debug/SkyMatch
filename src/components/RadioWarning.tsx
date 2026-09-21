import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useMeshStatusStore } from '../state/meshStatusStore';
import { USE_MOCK_MESH } from '../mesh/meshController';
import { useThemedStyles } from '../theme/ThemeContext';

/** What is wrong with the radio, in the order it is worth telling someone about. */
function diagnose(central: string | null, peripheralSupported: boolean, peripheralState: number | null) {
  if (central === 'Unauthorized') {
    return { title: 'SkyMatch no tiene permiso de Bluetooth', action: 'Dáselo en Ajustes' };
  }
  if (central === 'PoweredOff' || peripheralState === 4) {
    return { title: 'El Bluetooth está apagado', action: 'Enciéndelo para ver a quien tienes cerca' };
  }
  if (central === 'Unsupported') {
    return { title: 'Este móvil no puede usar Bluetooth de bajo consumo', action: null };
  }
  // Scanning but invisible: everyone else's list will never show us.
  if (central === 'PoweredOn' && !peripheralSupported) {
    return { title: 'Puedes ver a los demás, pero ellos no te ven', action: null };
  }
  return null;
}

/**
 * Says out loud when the radio isn't working.
 *
 * Bluetooth off, or permission denied, looks exactly like an empty room: you
 * wait, nobody appears, and nothing ever tells you the problem is yours and
 * one tap away. The diagnostics panel underneath only shows while the chat
 * is empty, so the moment a single message arrives the last clue is gone.
 */
export function RadioWarning() {
  const status = useMeshStatusStore();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    banner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1.5),
      backgroundColor: colors.danger,
      borderRadius: radii.md,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      marginBottom: spacing(1),
    },
    body: { flex: 1, gap: 2 },
    title: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 14 },
    action: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
    chevron: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' as const },
    spacer: { ...typography.subtitle, height: 0 },
  }));

  // The simulated cabin has no radio to complain about.
  if (USE_MOCK_MESH) return null;

  const problem = diagnose(status.centralState, status.peripheralSupported, status.peripheralState);
  if (!problem) return null;

  return (
    <Pressable style={styles.banner} onPress={() => void Linking.openSettings()}>
      <View style={styles.body}>
        <Text style={styles.title}>{problem.title}</Text>
        {problem.action && <Text style={styles.action}>{problem.action}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
