/**
 * App entry — NavigationContainer + the lazily-loaded RootNavigator.
 * Memory warms up in the background on launch (never blocks first paint).
 *
 * NOTE: the global ActionConfirmModal is intentionally NOT mounted here —
 * Home.tsx already lazy-mounts it (with an inline fallback); mounting it
 * twice would double-render the confirm dialog.
 */
import React, { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { getMemory } from './src/state/agent';

function LoadingFallback() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>UI loading…</Text>
    </View>
  );
}

export default function App() {
  const [Navigator, setNavigator] = useState<ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    // Warm the memory store in the background; never block first paint.
    getMemory().catch(() => {});
    import('./src/ui/navigation')
      .then((m) => {
        if (alive) setNavigator(() => m.RootNavigator);
      })
      .catch(() => {
        if (alive) setNavigator(() => LoadingFallback);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      {Navigator ? (
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      ) : (
        <LoadingFallback />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
