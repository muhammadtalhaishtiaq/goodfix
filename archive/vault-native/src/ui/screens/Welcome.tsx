/**
 * Welcome — wireframe §A #1. Earns trust in 5 seconds: the promise,
 * a phone-with-lock illustration, Get started, and a subtle link to
 * "How your privacy works" (§A #2).
 */
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { theme, fonts } from '../theme';

export default function Welcome({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.art} accessibilityLabel="Illustration: a phone with a lock">
            <View style={styles.phone}>
              <View style={styles.phoneNotch} />
              <View style={styles.lockCircle}>
                <Lock size={30} color={theme.accent} strokeWidth={2} />
              </View>
              <Text style={styles.phoneLabel}>your phone</Text>
            </View>
          </View>
          <Text style={styles.title}>Your private AI. It never leaves your phone.</Text>
          <Text style={styles.subtitle}>
            A private assistant that lives on your device — it remembers you and
            helps you get things done. Nothing you say ever leaves this phone.
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => navigation.replace('HowPrivacyWorks')}
          >
            <Text style={styles.buttonText}>Get started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('HowPrivacyWorks')}
          >
            <Text style={styles.link}>How your privacy works</Text>
          </TouchableOpacity>
          <View style={styles.badge}>
            <View style={styles.tealDot} />
            <Text style={styles.badgeText}>Private · on-device</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, padding: theme.pad * 1.5, justifyContent: 'space-between' },
  hero: { marginTop: 40, alignItems: 'center' },
  art: { marginBottom: 32 },
  phone: {
    width: 120,
    height: 210,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: theme.accent,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  phoneNotch: {
    position: 'absolute',
    top: 10,
    width: 44,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accentSoft,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: { ...fonts.small, color: theme.muted },
  title: {
    ...fonts.title,
    fontSize: 32,
    color: theme.ink,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    ...fonts.body,
    color: theme.muted,
    lineHeight: 24,
    textAlign: 'center',
  },
  bottom: { gap: 14, alignItems: 'center' },
  button: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { ...fonts.body, fontWeight: '600', color: '#FFFFFF' },
  link: {
    ...fonts.body,
    color: theme.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  badgeText: { ...fonts.small, color: theme.muted },
});
