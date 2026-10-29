/**
 * Permissions — wireframe §A #4.
 *
 * Plain-language pre-permission framing: each row explains WHY Vault wants
 * the permission in one line, and its Allow button now makes the REAL OS
 * request via the Expo module that owns that permission:
 *  - Notifications → expo-notifications get/requestPermissionsAsync
 *  - Reminders & Calendar → expo-calendar get/requestCalendarPermissions
 *    (plus get/requestRemindersPermissions on iOS — that API does not exist
 *    on Android, where this app's reminders are local notifications anyway)
 * Status shown on load comes from the same get* calls, so the screen
 * reflects the actual OS state instead of local React state.
 *  - Microphone → NOT wired on this screen: no installed package exposes a
 *    microphone-permission request (expo-audio is not installed, and no new
 *    dependency was added for this). The OS prompt appears at first voice
 *    capture instead, and the row is labeled that way rather than faking
 *    an "Allowed" state. Nothing is sent anywhere by any of this.
 */
import React, { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Mic, Bell, CalendarDays, Check } from 'lucide-react-native';
import { useVault } from '../../state/store';
import { theme, fonts } from '../theme';

type PermInfo = {
  granted: boolean;
  /** OS status string ('granted' | 'denied' | 'undetermined' | 'unavailable'). */
  status: string;
  canAskAgain: boolean;
};

type RowDef = {
  id: string;
  icon: typeof Mic;
  title: string;
  reason: string;
  /** Null when no installed package can request this permission here. */
  get: (() => Promise<PermInfo>) | null;
  request: (() => Promise<PermInfo>) | null;
  /** Extra honest note rendered under the reason (e.g. the mic row). */
  note?: string;
};

function toInfo(p: { granted: boolean; status: string; canAskAgain: boolean }): PermInfo {
  return { granted: p.granted, status: p.status, canAskAgain: p.canAskAgain };
}

async function getNotificationsInfo(): Promise<PermInfo> {
  return toInfo(await Notifications.getPermissionsAsync());
}

async function requestNotificationsInfo(): Promise<PermInfo> {
  return toInfo(await Notifications.requestPermissionsAsync());
}

async function getCalendarInfo(): Promise<PermInfo> {
  const cal = toInfo(await Calendar.getCalendarPermissions());
  if (Platform.OS !== 'ios') return cal;
  // Reminders permission is iOS-only in expo-calendar (throws elsewhere).
  const rem = toInfo(await Calendar.getRemindersPermissions());
  return {
    granted: cal.granted && rem.granted,
    status: cal.granted ? rem.status : cal.status,
    canAskAgain: cal.canAskAgain || rem.canAskAgain,
  };
}

async function requestCalendarInfo(): Promise<PermInfo> {
  const cal = toInfo(await Calendar.requestCalendarPermissions());
  if (Platform.OS !== 'ios') return cal;
  const rem = toInfo(await Calendar.requestRemindersPermissions());
  return {
    granted: cal.granted && rem.granted,
    status: cal.granted ? rem.status : cal.status,
    canAskAgain: cal.canAskAgain || rem.canAskAgain,
  };
}

const ROWS: RowDef[] = [
  {
    id: 'mic',
    icon: Mic,
    title: 'Microphone',
    reason: 'So you can capture notes by voice.',
    get: null,
    request: null,
    note: 'Not requested here yet — the system asks when you first record a voice note.',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    reason: 'So your reminders can reach you on time.',
    get: getNotificationsInfo,
    request: requestNotificationsInfo,
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Reminders & Calendar',
    reason: 'So Vault can set reminders and events for you.',
    get: getCalendarInfo,
    request: requestCalendarInfo,
  },
];

export default function Permissions({ navigation }: any) {
  const setOnboarded = useVault((s) => s.setOnboarded);
  const [info, setInfo] = useState<Record<string, PermInfo>>({});
  const [busy, setBusy] = useState<string | null>(null);

  // Show the real OS-granted state on load, not local optimism.
  useEffect(() => {
    let live = true;
    (async () => {
      for (const row of ROWS) {
        if (!row.get) continue;
        try {
          const p = await row.get();
          if (live) setInfo((prev) => ({ ...prev, [row.id]: p }));
        } catch {
          if (live) {
            setInfo((prev) => ({
              ...prev,
              [row.id]: { granted: false, status: 'unavailable', canAskAgain: false },
            }));
          }
        }
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function handleAllow(row: RowDef) {
    if (!row.request || busy) return;
    setBusy(row.id);
    try {
      const p = await row.request();
      setInfo((prev) => ({ ...prev, [row.id]: p }));
    } catch {
      setInfo((prev) => ({
        ...prev,
        [row.id]: { granted: false, status: 'unavailable', canAskAgain: false },
      }));
    } finally {
      setBusy(null);
    }
  }

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
            Vault needs these to help you. Here’s exactly why, in plain words.
          </Text>
          <View style={styles.rows}>
            {ROWS.map((r) => {
              const p = info[r.id];
              const isAllowed = p?.granted === true;
              const isDenied = p?.status === 'denied' && !p.canAskAgain;
              const isUnavailable = p?.status === 'unavailable';
              const notWired = !r.request;
              const disabled =
                isAllowed || isDenied || isUnavailable || notWired || busy === r.id;
              const label = notWired
                ? 'First use'
                : isAllowed
                  ? 'Allowed'
                  : isUnavailable
                    ? 'Unavailable'
                    : isDenied
                      ? 'Denied'
                      : busy === r.id
                        ? 'Asking…'
                        : 'Allow';
              return (
                <View key={r.id} style={styles.row}>
                  <View style={styles.iconWrap}>
                    <r.icon size={26} color={theme.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{r.title}</Text>
                    <Text style={styles.rowReason}>{r.reason}</Text>
                    {r.note ? <Text style={styles.rowNote}>{r.note}</Text> : null}
                    {isDenied ? (
                      <Text style={styles.rowNote}>
                        Turn this on in your system Settings if you change your mind.
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.allowBtn, (isAllowed || disabled) && styles.allowBtnDone]}
                    activeOpacity={0.85}
                    disabled={disabled}
                    onPress={() => handleAllow(r)}
                    accessibilityLabel={
                      notWired
                        ? `${r.title}: requested at first use`
                        : `Allow ${r.title}`
                    }
                  >
                    {isAllowed ? (
                      <View style={styles.allowedContent}>
                        <Check size={14} color={theme.accent} strokeWidth={2.5} />
                        <Text style={[styles.allowText, styles.allowTextDone]}>{label}</Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.allowText,
                          disabled && styles.allowTextDone,
                        ]}
                      >
                        {label}
                      </Text>
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
  rowNote: { fontSize: 12, color: theme.muted, lineHeight: 17, marginTop: 4 },
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
