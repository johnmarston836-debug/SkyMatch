import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ACCENTS, useSettingsStore } from '../src/state/settingsStore';
import { t } from '../src/i18n';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function render() {
  const navigation = { goBack: jest.fn() } as never;
  return ReactTestRenderer.create(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <SettingsScreen navigation={navigation} route={{ key: 'k', name: 'Settings' } as never} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('settings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState({ appearance: 'system', accent: 'blue', hydrated: false });
  });

  it('chooses the appearance and the highlight colour, and remembers both', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      tree = render();
    });
    const dark = tree!.root
      .findAll((node) => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function')
      .find((node) => node.findAll((child) => child.props.children === t.settings.appearanceDark).length > 0);
    await ReactTestRenderer.act(() => dark!.props.onPress());
    expect(useSettingsStore.getState().appearance).toBe('dark');

    const green = tree!.root.find((node) => node.props.accessibilityLabel === t.settings.accentNames.green && typeof node.props.onPress === 'function');
    await ReactTestRenderer.act(() => green.props.onPress());
    expect(useSettingsStore.getState().accent).toBe('green');

    useSettingsStore.setState({ appearance: 'system', accent: 'blue' });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState()).toMatchObject({ appearance: 'dark', accent: 'green' });
    expect(ACCENTS.green).toMatch(/^#/);
    await ReactTestRenderer.act(() => tree!.unmount());
  });
});
