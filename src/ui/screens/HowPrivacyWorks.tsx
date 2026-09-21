/**
 * HowPrivacyWorks — wireframe §A #2.
 *
 * The 5-second trust pitch, second half: three cards in plain language,
 * then Continue into the model download.
 */
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Smartphone, Lock, Eye } from 'lucide-react-native';
import { theme, fonts } from '../theme';

const CARDS = [
  {
    icon: Smartphone,
    title: 'Runs on your phone',
    line: 'The AI lives on this device — not in someone else\u2019s cloud.',
  },
  {
    icon: Lock,
    title: 'Nothing leaves without your permission',
    line: 'Vault always asks before acting or sharing anything.',
  },
  {
    icon: Eye,
    title: 'You can see everything it remembers',
    line: 'Open the Memory tab anytime to read, edit, or delete it all.',
  },
];

export default function HowPrivacyWorks({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>How your privacy works</Text>
          <Text style={styles.sub}>Three simple promises. No fine print.</Text>
          <View style={styles.cards}>
            {CARDS.map((c) => (
              <View key={c.title} style={styles.card}>
                <View style={styles.iconWrap}>
                  <c.icon size={28} color={theme.accent} strokeWidth={2} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardLine}>{c.line}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => navigation.replace('Onboarding')}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
  hero: { marginTop: 32 },
  title: { ...fonts.title, fontSize: 28, color: theme.ink, marginBottom: 8 },
  sub: { ...fonts.body, color: theme.muted, marginBottom: 28, lineHeight: 24 },
  cards: { gap: 12 },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: theme.pad * 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.ink, marginBottom: 4 },
  cardLine: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  bottom: { gap: 16, alignItems: 'center' },
  button: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { ...fonts.body, fontWeight: '600', color: '#FFFFFF' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  badgeText: { ...fonts.small, color: theme.muted },
});
