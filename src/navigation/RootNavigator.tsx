import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { SeatPickerScreen } from '../screens/onboarding/SeatPickerScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { SwipeDeckScreen } from '../screens/discovery/SwipeDeckScreen';
import { MatchesListScreen } from '../screens/matches/MatchesListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { colors } from '../theme';
import type { Seat } from '../types';

export type OnboardingStackParamList = {
  Welcome: undefined;
  SeatPicker: undefined;
  ProfileSetup: { seat: Seat };
};

export type MainStackParamList = {
  SwipeDeck: undefined;
  Matches: undefined;
  Chat: { matchId: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, text: colors.text },
};

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="SeatPicker" component={SeatPickerScreen} />
      <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="SwipeDeck" component={SwipeDeckScreen} />
      <MainStack.Screen name="Matches" component={MatchesListScreen} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: '' }} />
    </MainStack.Navigator>
  );
}

export function RootNavigator({ hasProfile }: { hasProfile: boolean }) {
  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasProfile ? 'Main' : 'Onboarding'}>
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
