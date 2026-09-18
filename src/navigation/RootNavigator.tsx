import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { SeatPickerScreen } from '../screens/onboarding/SeatPickerScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { CabinChatScreen } from '../screens/cabin/CabinChatScreen';
import { PassengersScreen } from '../screens/passengers/PassengersScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyProfileScreen } from '../screens/profile/MyProfileScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { useAppTheme } from '../theme/ThemeContext';
import type { Seat } from '../types';

export type OnboardingStackParamList = {
  Welcome: undefined;
  SeatPicker: undefined;
  ProfileSetup: { seat: Seat };
};

export type MainStackParamList = {
  CabinChat: undefined;
  Passengers: undefined;
  MyProfile: undefined;
  Profile: { peerId: string };
  Chat: { peerId: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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
      <MainStack.Screen name="CabinChat" component={CabinChatScreen} />
      <MainStack.Screen name="Passengers" component={PassengersScreen} />
      <MainStack.Screen name="MyProfile" component={MyProfileScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: '' }} />
    </MainStack.Navigator>
  );
}

export function RootNavigator({ hasProfile }: { hasProfile: boolean }) {
  const { colors, scheme } = useAppTheme();
  const base = scheme === 'light' ? DefaultTheme : DarkTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: colors.background, card: colors.background, text: colors.text } };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasProfile ? 'Main' : 'Onboarding'}>
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
