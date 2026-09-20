import { useCallback, useRef } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * How far from the bottom still counts as "reading the latest". A couple of
 * pixels of rubber-banding, or a half-scrolled bubble, shouldn't be read as
 * the user having gone back through the conversation.
 */
const BOTTOM_SLACK = 60;

/**
 * Keeps a chat pinned to its newest message, and gets out of the way the
 * moment the user scrolls up to read older ones: new arrivals then pile up
 * below without yanking the screen away from what they are reading. Sending
 * a message always brings them back down - you wrote it, you want to see it.
 */
export function useChatAutoScroll<T>() {
  const listRef = useRef<FlatList<T>>(null);
  const pinned = useRef(true);
  /** The very first scroll is the chat opening, which shouldn't visibly slide. */
  const settled = useRef(false);

  const scrollToEnd = useCallback((animated: boolean) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  /** Call right after sending: it re-pins even if the user had scrolled up. */
  const stickToEnd = useCallback(() => {
    pinned.current = true;
    scrollToEnd(true);
  }, [scrollToEnd]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const fromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    pinned.current = fromBottom <= BOTTOM_SLACK;
  }, []);

  /** Fires for every new message, and again when a photo finishes loading. */
  const handleContentSizeChange = useCallback(() => {
    if (!pinned.current) return;
    scrollToEnd(settled.current);
    settled.current = true;
  }, [scrollToEnd]);

  /** The list gets shorter when the keyboard comes up; follow it down. */
  const handleLayout = useCallback(() => {
    if (pinned.current) scrollToEnd(settled.current);
  }, [scrollToEnd]);

  return { listRef, stickToEnd, handleScroll, handleContentSizeChange, handleLayout };
}
