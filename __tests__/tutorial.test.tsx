import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HowItWorksScreen } from '../src/screens/tutorial/TutorialScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { t } from '../src/i18n';

jest.useFakeTimers();

test('shows the three pages, with phones rather than seats in the diagrams', async () => {
  const navigation = { goBack: jest.fn() } as never;
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <ThemeProvider>
          <HowItWorksScreen navigation={navigation} route={{ key: 'k', name: 'HowItWorks' } as never} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  const text = JSON.stringify(tree!.toJSON());
  for (const key of ['page1Title', 'page2Title', 'page3Title', 'page1CalloutTitle', 'page3Caption'] as const) {
    expect(text).toContain(JSON.stringify(t.tutorial[key]).slice(1, -1));
  }
  expect(text).not.toMatch(/14C|21F/);
  // Three diagrams, each with you in it.
  expect(text.split(`"${t.tutorial.diagramYou}"`).length - 1).toBe(3);
  await ReactTestRenderer.act(() => tree!.unmount());
});
