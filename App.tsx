import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useProfileStore } from './src/state/profileStore';
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

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
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
});

export default App;
