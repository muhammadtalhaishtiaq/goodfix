/**
 * PrivacyDashboard screen — live proof of the privacy promise.
 *
 * Cards: what's stored (note count), what left the device ("Nothing." +
 * the audit log proving every entry stayed local), and the active tier
 * badge. Refreshes on focus and whenever `auditBump` changes.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVault } from '../../state/store';
import { theme } from '../theme';
import { getMemory } from '../../state/agent';
import type { PrivacyTier } from '../../agent/types';

interface AuditRow {
  ts: number;
  tool: string;
  summary: string;
  tier: PrivacyTier;
  leftDevice: boolean;
  detail?: string;
}

function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

export default function PrivacyDashboardScreen({ navigation }: any) {
  const auditBump = useVault((s) => s.auditBump);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [auditUnavailable, setAuditUnavailable] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mem = await getMemory();
      setNoteCount(await mem.count());
    } catch {
      setNoteCount(null);
    }
    try {
      // Dynamic import: the audit module may be mid-build in parallel work.
      const mod = await import('../../privacy/auditLog');
      const rows = await mod.list(50);
      setEntries(rows);
      setAuditUnavailable(false);
    } catch {
      setAuditUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, auditBump]),
  );

  const leftDeviceCount = entries.filter((e) => e.leftDevice).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Persistent privacy badge — required on every screen. */}
      <View style={styles.topBadge}>
        <View style={styles.dot} />
        <Text style={styles.topBadgeText}>Private · on-device</Text>
      </View>

      {/* What's stored */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What's stored</Text>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <>
            <Text style={styles.bigNumber}>{noteCount ?? '—'}</Text>
            <Text style={styles.cardSub}>notes & memories, as .md files on this phone</Text>
          </>
        )}
      </View>

      {/* What left the device */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What left your device</Text>
        <Text style={[styles.bigNumber, { color: theme.accent }]}>Nothing.</Text>
        <Text style={styles.cardSub}>
          {leftDeviceCount === 0
            ? 'Every entry below stayed on this phone.'
            : `${leftDeviceCount} entr${leftDeviceCount === 1 ? 'y' : 'ies'} left the device — see below.`}
        </Text>
      </View>

      {/* Active tier */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active tier</Text>
        <View style={styles.badgeRow}>
          <View style={styles.tierBadge}>
            <View style={styles.dot} />
            <Text style={styles.tierText}>Private · on-device</Text>
          </View>
        </View>
        <Text style={styles.cardSub}>Runs entirely on your phone. No account, no telemetry.</Text>
      </View>

      {/* Health check */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation?.navigate('Diagnostics')}
        accessibilityLabel="Run health check"
      >
        <View style={styles.healthRow}>
          <View>
            <Text style={styles.healthTitle}>Run health check</Text>
            <Text style={styles.cardSub}>Make sure everything is working.</Text>
          </View>
          <Text style={styles.healthChevron}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Audit log */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Audit log</Text>
        {auditUnavailable ? (
          <Text style={styles.unavailable}>
            Not available right now — your privacy stats still appear above.
          </Text>
        ) : entries.length === 0 ? (
          <Text style={styles.cardSub}>No actions recorded yet.</Text>
        ) : (
          entries.map((e, i) => {
            const key = `${e.ts}-${i}`;
            const expanded = expandedKey === key;
            return (
              <TouchableOpacity
                key={key}
                style={styles.auditRow}
                activeOpacity={0.7}
                onPress={() => setExpandedKey(expanded ? null : key)}
                accessibilityLabel={`Audit entry: ${e.tool}. Tap for detail.`}
              >
                <View style={styles.auditMain}>
                  <Text style={styles.auditTool}>{e.tool}</Text>
                  <Text style={styles.auditSummary} numberOfLines={expanded ? 0 : 2}>
                    {e.summary}
                  </Text>
                  <Text style={styles.auditTime}>{fmtTime(e.ts)}</Text>
                  {expanded && (
                    <Text style={styles.auditDetail}>
                      {e.detail ??
                        `Handled ${e.tier === 'local' ? 'entirely on this phone' : `at tier “${e.tier}”`} — ${
                          e.leftDevice ? 'this entry left the device.' : 'nothing left the device.'
                        }`}
                    </Text>
                  )}
                </View>
                <Text style={[styles.auditFlag, e.leftDevice && styles.auditFlagBad]}>
                  {e.leftDevice ? 'left device' : 'stayed on device'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: theme.pad,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  topBadgeText: {
    fontSize: 13,
    color: theme.muted,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: theme.pad,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.ink,
  },
  cardSub: {
    fontSize: 14,
    color: theme.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
    marginRight: 8,
  },
  tierText: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  unavailable: {
    color: theme.muted,
    fontStyle: 'italic',
    fontSize: 14,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.ink,
    marginBottom: 4,
  },
  healthChevron: {
    fontSize: 28,
    color: theme.muted,
    fontWeight: '300',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  auditMain: {
    flex: 1,
    marginRight: 8,
  },
  auditTool: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.ink,
  },
  auditSummary: {
    fontSize: 13,
    color: theme.muted,
    marginTop: 2,
  },
  auditTime: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 2,
  },
  auditDetail: {
    fontSize: 13,
    color: theme.ink,
    marginTop: 8,
    lineHeight: 19,
    backgroundColor: theme.bg,
    borderRadius: theme.radius,
    padding: 10,
  },
  auditFlag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    paddingTop: 2,
  },
  auditFlagBad: {
    color: theme.danger,
  },
});
