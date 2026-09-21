import React from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';

interface Props {
  /** Raw base64 JPEG, as it travels over the mesh. Null closes the viewer. */
  imageBase64: string | null;
  onClose: () => void;
}

/**
 * Full screen photo with pinch to zoom. The zooming is the ScrollView's own
 * (`maximumZoomScale`), which on iOS is the same pinch-and-pan the Photos app
 * uses and costs no extra gesture library.
 */
export function PhotoViewer({ imageBase64, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  return (
    <Modal visible={imageBase64 !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.zoom}
          contentContainerStyle={{ width, height }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
        >
          {/* Tapping anywhere on the photo closes it, like any gallery. */}
          <Pressable style={styles.fill} onPress={onClose}>
            {imageBase64 !== null && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                style={styles.fill}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </ScrollView>

        <Pressable style={[styles.close, { top: insets.top + 12 }]} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>{t.common.close}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000' },
  zoom: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  close: { position: 'absolute', right: 20 },
  closeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
