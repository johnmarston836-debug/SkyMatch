import React from 'react';
import { Image, Text, View } from 'react-native';
import { useAvatarStore } from '../state/avatarStore';
import { useThemedStyles } from '../theme/ThemeContext';

interface Props {
  /** Profile id; omit for your own avatar. */
  peerId?: string;
  nickname: string;
  size: number;
}

/** Someone's photo if it has made it across the mesh, their initial if it hasn't. */
export function Avatar({ peerId, nickname, size }: Props) {
  const myAvatar = useAvatarStore((state) => state.myAvatar);
  const peerAvatars = useAvatarStore((state) => state.peerAvatars);
  const image = peerId === undefined ? myAvatar : peerAvatars[peerId];
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

  if (image) {
    return <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={[styles.circle, box]} resizeMode="cover" />;
  }

  return (
    <View style={[styles.circle, box]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{(nickname || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}
