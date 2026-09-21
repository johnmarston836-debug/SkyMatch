import React from 'react';
import { Text, View } from 'react-native';
import { useMeshStatusStore } from '../state/meshStatusStore';
import { USE_MOCK_MESH } from '../mesh/meshController';
import { useThemedStyles } from '../theme/ThemeContext';

/** react-native-ble-plx's scanner states, in plain Spanish. */
function describeCentral(state: string | null): string {
  switch (state) {
    case 'PoweredOn':
      return 'encendido';
    case 'PoweredOff':
      return 'apagado';
    case 'Unauthorized':
      return 'sin permiso';
    case 'Unsupported':
      return 'no disponible';
    case null:
      return 'iniciando…';
    default:
      return state;
  }
}

/** CoreBluetooth's CBManagerState, which the native peripheral module reports. */
function describePeripheral(state: number | null): string {
  switch (state) {
    case 5:
      return 'encendido';
    case 4:
      return 'apagado';
    case 3:
      return 'sin permiso';
    case 2:
      return 'no disponible';
    case null:
      return 'sin respuesta';
    default:
      return 'iniciando…';
  }
}

/**
 * Shown while the cabin is empty, because "nobody is here" and "the radio
 * never started" look identical from the outside. Tells apart not being
 * visible to others, not seeing anyone, and seeing people but failing to
 * connect to them.
 */
export function MeshStatus() {
  const status = useMeshStatusStore();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      gap: spacing(0.5),
      marginTop: spacing(3),
      alignSelf: 'stretch' as const,
    },
    label: { ...typography.label, marginBottom: spacing(0.5) },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, gap: spacing(2) },
    key: { ...typography.subtitle, fontSize: 13 },
    value: { ...typography.body, fontSize: 13, fontWeight: '700' as const },
    valueBad: { color: colors.danger },
  }));

  if (USE_MOCK_MESH) return null;

  const advertisingBroken = !status.peripheralSupported || status.peripheralState !== 5;
  const centralBroken = status.centralState !== 'PoweredOn';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>ESTADO DE LA RADIO</Text>

      <View style={styles.row}>
        <Text style={styles.key}>Te ven (emitiendo)</Text>
        <Text style={[styles.value, advertisingBroken && styles.valueBad]}>
          {status.peripheralSupported ? describePeripheral(status.peripheralState) : 'módulo no cargado'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Tú buscas (escaneo)</Text>
        <Text style={[styles.value, centralBroken && styles.valueBad]}>{describeCentral(status.centralState)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Móviles detectados</Text>
        <Text style={styles.value}>{status.nearby}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Conectados</Text>
        <Text style={styles.value}>{status.connected}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Te escuchan</Text>
        <Text style={styles.value}>{status.subscribers}</Text>
      </View>
    </View>
  );
}
