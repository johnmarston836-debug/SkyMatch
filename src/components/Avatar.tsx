import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { PhotoViewer } from './PhotoViewer';
import { bestImage, useAvatarStore } from '../state/avatarStore';
import { useThemedStyles } from '../theme/ThemeContext';

interface Props {
  /** Profile id; omit for your own avatar. */
  peerId?: string;
  nickname: string;
  size: number;
  /** Tapping the photo opens it full screen, where it can be pinched to zoom. */
  zoomable?: boolean;
  /** Marks the photo with the red "no connection" sign (see ConversationPeer). */
  offline?: boolean;
}

/**
 * The red "no connection" sign: a no-entry disc over the corner of the
 * photo, drawn rather than an emoji or icon font so it looks the same on
 * every phone - and red because it is the one thing on the row that says
 * "what you write here won't arrive".
 */
function OfflineMark({ size }: { size: number }) {
  const mark = Math.max(12, Math.round(size * 0.32));
  const styles = useThemedStyles(({ colors }) => ({
    disc: {
      position: 'absolute' as const,
      right: -1,
      bottom: -1,
      width: mark,
      height: mark,
      borderRadius: mark / 2,
      backgroundColor: colors.danger,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    bar: { width: mark * 0.5, height: Math.max(2, mark * 0.14), borderRadius: 1, backgroundColor: '#FFFFFF' },
  }));
  return (
    <View style={styles.disc} accessibilityLabel="offline">
      <View style={styles.bar} />
    </View>
  );
}

/** Someone's photo if it has made it across the mesh, their initial if it hasn't. */
export function Avatar({ offline = false, ...props }: Props) {
  if (!offline) return <AvatarImage {...props} />;
  // The photo fades, the mark doesn't: it is what the reader should see.
  return (
    <View>
      <View style={offlinePhoto}>
        <AvatarImage {...props} />
      </View>
      <OfflineMark size={props.size} />
    </View>
  );
}

const offlinePhoto = { opacity: 0.55 };

function AvatarImage({ peerId, nickname, size, zoomable = false }: Omit<Props, 'offline'>) {
  const myAvatar = useAvatarStore((state) => state.myAvatar);
  // The one person's entry, not the whole record: a selector that returned
  // the record would re-render every avatar on screen each time any face
  // arrived.
  const theirs = useAvatarStore((state) => (peerId === undefined ? undefined : state.peerAvatars[peerId]));
  const [zoomed, setZoomed] = useState(false);
  // Whichever size has arrived. A face shown at 40 points looks the same
  // either way, so the thumbnail standing in until the portrait lands is
  // invisible here and saves five sixths of the frames.
  const image = peerId === undefined ? myAvatar : bestImage(theirs);
  const styles = useThemedStyles(({ colors, radii }) => ({
    circle: {
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    },
    initial: { color: colors.text, fontWeight: '700' as const },
  }));

  const box = { width: size, height: size };

  if (!image) {
    return (
      <View style={[styles.circle, box]}>
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{(nickname || '?').charAt(0).toUpperCase()}</Text>
      </View>
    );
  }

  const photo = (
    <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={[styles.circle, box]} resizeMode="cover" />
  );

  if (!zoomable) return photo;

  return (
    <>
      <Pressable onPress={() => setZoomed(true)}>{photo}</Pressable>
      <PhotoViewer imageBase64={zoomed ? image : null} onClose={() => setZoomed(false)} />
    </>
  );
}
