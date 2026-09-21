import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useProfileStore } from './src/state/profileStore';
import { useAvatarStore } from './src/state/avatarStore';
import { useBlockStore } from './src/state/blockStore';
import { useChatStore } from './src/state/chatStore';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { colors, scheme } = useAppTheme();
  const hydrate = useProfileStore((state) => state.hydrate);
  const hydrated = useProfileStore((state) => state.hydrated);
  const profile = useProfileStore((state) => state.profile);
  const hydrateAvatar = useAvatarStore((state) => state.hydrate);
  const hydrateMuted = useBlockStore((state) => state.hydrate);
  const hydrateChats = useChatStore((state) => state.hydrate);
  const avatarsHydrated = useAvatarStore((state) => state.hydrated);

  useEffect(() => {
    void hydrate();
    void hydrateAvatar();
    void hydrateMuted();
    void hydrateChats();
  }, [hydrate, hydrateAvatar, hydrateMuted, hydrateChats]);

  // Both, not just the profile: the mesh starts as soon as this screen goes
  // away, and starting it before the photos are off disk means announcing
  // that we have none.
  if (!hydrated || !avatarsHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Image
          source={require('./src/assets/branding/logo.png')}
          // One transparent mark for both themes: the file is a solid shape,
          // so tinting it to the theme's text colour is lossless and saves
          // shipping a second copy that could drift from the first.
          style={[styles.logo, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <Text style={[styles.byline, { color: colors.textMuted }]}>by EFS</Text>
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={scheme === 'light' ? 'dark-content' : 'light-content'} />
      <RootNavigator hasProfile={!!profile} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 160, height: 160 },
  byline: { marginTop: 8, fontSize: 15, fontWeight: '600' },
  spinner: { marginTop: 24 },
});

export default App;
