import type { ImageSourcePropType } from 'react-native';
import type { ReactionKind } from '../types';

/** Drawn by hand rather than emoji, which render as tofu boxes on some devices. */
export const REACTION_ICONS: Record<ReactionKind, ImageSourcePropType> = {
  ok: require('../assets/icons/reaction-ok.png'),
  heart: require('../assets/icons/reaction-heart.png'),
  laugh: require('../assets/icons/reaction-laugh.png'),
};

export const REACTION_ORDER: ReactionKind[] = ['ok', 'heart', 'laugh'];
