/**
 * Permissions — wireframe §A #4.
 *
 * Plain-language pre-permission framing: each row explains WHY Vault wants
 * the permission in one line. The OS still prompts natively at first use;
 * this screen just sets expectations. "Allow" records the user's
 * acknowledgement locally; nothing is sent anywhere.
 */
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mic, Bell, CalendarDays, Check } from 'lucide-react-native';
import { useVault } from '../../state/store';
import { theme, fonts } from '../theme';

const ROWS = [
  {
    id: 'mic',
    icon: Mic,
    title: 'Microphone',
    reason: 'So you can capture notes by voice.',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    reason: 'So your reminders can reach you on time.',
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Reminders & Calendar',
    reason: 'So Vault can set reminders and events for you.',
  },
];

export default function Permissions({ navigation }: any) {
  const setOnboarded = useVault((s) => s.setOnboarded);
  const [allowed, setAllowed] = useState<string[]>([]);

  function finish() {
    setOnboarded(true);
    navigation.replace('Main');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>A few permissions</Text>
          <Text style={styles.sub}>
            Vault needs these to help you. Here\u2019s exactly why, in plain words.
          </Text>
          <View style={styles.rows}>
            {ROWS.map((r) => {
              const isAllowed = allowed.includes(r.id);
              return (
                <View key={r.id} style={styles.row}>
                  <View style={styles.iconWrap}>
                    <r.icon size={26} color={theme.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{r.title}</Text>
                    <Text style={styles.rowReason}>{r.reason}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.allowBtn, isAllowed && styles.allowBtnDone]}
                    activeOpacity={0.85}
                    disabled={isAllowed}
                    onPress={() => setAllowed((a) => [...a, r.id])}
                    accessibilityLabel={`Allow ${r.title}`}
                  >
                    {isAllowed ? (
                      <View style={styles.allowedContent}>
                        <Check size={14} color={theme.accent} strokeWidth={2.5} />
                        <Text style={[styles.allowText, styles.allowTextDone]}>Allowed</Text>
                      </View>
                    ) : (
                      <Text style={styles.allowText}>Allow</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.footer}>These are used only on your device.</Text>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={finish}>
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
  rows: { gap: 12 },
  row: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: theme.pad,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: theme.ink, marginBottom: 2 },
  rowReason: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  allowBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  allowBtnDone: { backgroundColor: theme.accentSoft },
  allowedContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  allowText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  allowTextDone: { color: theme.accent },
  bottom: { gap: 16, alignItems: 'center' },
  footer: { ...fonts.small, color: theme.muted, textAlign: 'center' },
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
