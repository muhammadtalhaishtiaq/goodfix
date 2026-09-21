import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Brain, ShieldCheck } from 'lucide-react-native';
import { theme, fonts } from './theme';
import Welcome from './screens/Welcome';
import HowPrivacyWorks from './screens/HowPrivacyWorks';
import Onboarding from './screens/Onboarding';
import Permissions from './screens/Permissions';
import Home from './screens/Home';
import VoiceModal from './screens/VoiceModal';

/**
 * Placeholder for screens built by the other agent (Memory, Privacy,
 * Diagnostics). Loads them lazily; falls back to this if the file isn't
 * there yet, so this half of the app typechecks and runs independently.
 */
function Placeholder({ route }: any) {
  return (
    <View style={styles.placeholder}>
      <Text style={[fonts.title, { color: theme.ink }]}>{route?.name ?? 'Screen'}</Text>
      <Text style={[fonts.body, { color: theme.muted, marginTop: 8 }]}>
        coming right up
      </Text>
    </View>
  );
}

function lazyScreen(modulePath: './screens/Memory' | './screens/Privacy' | './screens/Diagnostics'): React.ComponentType<any> {
  try {
    const m = require(modulePath);
    return (m && (m.default ?? m)) || Placeholder;
  } catch {
    return Placeholder;
  }
}

const MemoryScreen = lazyScreen('./screens/Memory');
const PrivacyScreen = lazyScreen('./screens/Privacy');
const DiagnosticsScreen = lazyScreen('./screens/Diagnostics');

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="Memory"
        component={MemoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Brain size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ShieldCheck size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="HowPrivacyWorks" component={HowPrivacyWorks} />
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Permissions" component={Permissions} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="VoiceModal"
        component={VoiceModal}
        options={{ presentation: 'modal' }}
      />
      {/* Health check (Diagnostics) is not a tab — it's reached from the
          Privacy screen's "Run health check" row. */}
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.pad,
  },
});
