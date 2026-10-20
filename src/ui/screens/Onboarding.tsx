/**
 * Onboarding — wireframe §A #3 (model download / setup).
 *
 * Centered progress ring while the on-device models download, with
 * reassurance copy. Downloads BOTH models: the chat model (the agent
 * itself) and the smaller embedding model, without which semantic recall
 * can never activate and memory search falls back to keywords only. If the
 * embedding download fails after the chat model landed, setup still
 * completes — recall honestly degrades to keyword search until the embed
 * model is present (see memory/index.ts resolveEmbedFn).
 * The skip path uses plain language ("Explore first — download later");
 * the wireframes have no "demo mode" concept.
 */
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVault } from '../../state/store';
import { theme, fonts } from '../theme';

interface ModelManagerModule {
  downloadModel?: (
    kind: string,
    onProgress?: (bytesWritten: number, totalBytes: number) => void,
  ) => Promise<unknown>;
}

/** Lazy-loads the model manager (built by the other agent); null if not ready. */
function loadModelManager(): ModelManagerModule | null {
  try {
    const m = require('../../inference/modelManager');
    if (m && typeof m.downloadModel === 'function') {
      return m as ModelManagerModule;
    }
    return null;
  } catch {
    return null;
  }
}

const TICKS = 28;
const RING_SIZE = 132;
const RING_RADIUS = 52;

function ProgressRing({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  const filled = Math.round(progress * TICKS);
  const center = RING_SIZE / 2;
  return (
    <View style={styles.ring} accessibilityLabel={`Downloading, ${pct} percent`}>
      {Array.from({ length: TICKS }, (_, i) => {
        const angle = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
        const x = center + RING_RADIUS * Math.cos(angle) - 3;
        const y = center + RING_RADIUS * Math.sin(angle) - 3;
        return (
          <View
            key={i}
            style={[
              styles.tick,
              { left: x, top: y, backgroundColor: i < filled ? theme.accent : theme.accentSoft },
            ]}
          />
        );
      })}
      <View style={styles.ringCenter}>
        <Text style={styles.ringPct}>{pct}%</Text>
      </View>
    </View>
  );
}

export default function Onboarding({ navigation }: any) {
  const modelState = useVault((s) => s.modelState);
  const modelProgress = useVault((s) => s.modelProgress);
  const modelError = useVault((s) => s.modelError);
  const setModelState = useVault((s) => s.setModelState);
  const [busy, setBusy] = useState(false);

  const downloading = modelState === 'downloading';

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    setModelState('downloading', 0);
    try {
      const mm = loadModelManager();
      if (!mm || typeof mm.downloadModel !== 'function') {
        throw new Error('not-ready');
      }
      // Progress is split by approximate size: chat ~2.0 GB of the ~2.64 GB
      // total, embed the rest. totalBytes can be -1 when the server omits
      // Content-Length; then that model's slice just stays where it was.
      const CHAT_SHARE = 0.75;
      const toFraction = (written: number, total: number) =>
        total > 0 ? Math.min(Math.max(written / total, 0), 1) : 0;
      await mm.downloadModel('chat', (written, total) =>
        useVault
          .getState()
          .setModelState('downloading', toFraction(written, total) * CHAT_SHARE),
      );
      try {
        await mm.downloadModel('embed', (written, total) =>
          useVault
            .getState()
            .setModelState(
              'downloading',
              CHAT_SHARE + toFraction(written, total) * (1 - CHAT_SHARE),
            ),
        );
      } catch {
        // Chat model is in; the embed model is not. Setup still completes:
        // memory recall degrades to keyword (FTS) search until the embed
        // model exists — it never fakes semantic results.
      }
      setModelState('ready', 1);
      navigation.replace('Permissions');
    } catch {
      setModelState(
        'error',
        0,
        'The download isn\u2019t ready just yet — you can explore first and download the model later.',
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSkip() {
    navigation.replace('Permissions');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Setting up your private AI</Text>
          <Text style={styles.body}>
            Downloads once, then works offline. About 2.6 GB for both models
            — best over Wi-Fi. Nothing you say ever leaves this device.
          </Text>

          {downloading && <ProgressRing progress={modelProgress} />}

          {modelState === 'error' && modelError && (
            <Text style={styles.error}>{modelError}</Text>
          )}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.button, styles.primary, downloading && styles.disabled]}
            activeOpacity={0.85}
            disabled={downloading}
            onPress={handleDownload}
          >
            <Text style={styles.primaryText}>
              {downloading ? 'Downloading…' : 'Download private model'}
            </Text>
          </TouchableOpacity>
          {!downloading && (
            <TouchableOpacity
              style={[styles.button, styles.secondary]}
              activeOpacity={0.85}
              onPress={handleSkip}
            >
              <Text style={styles.secondaryText}>Explore first — download later</Text>
            </TouchableOpacity>
          )}
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
  title: {
    ...fonts.title,
    fontSize: 28,
    color: theme.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    ...fonts.body,
    color: theme.muted,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: { fontSize: 26, fontWeight: '800', color: theme.ink },
  error: { ...fonts.body, color: theme.danger, marginTop: 24, lineHeight: 22, textAlign: 'center' },
  bottom: { gap: 12, alignItems: 'center' },
  button: {
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primary: { backgroundColor: theme.accent },
  primaryText: { ...fonts.body, fontWeight: '600', color: '#FFFFFF' },
  secondary: { backgroundColor: theme.accentSoft },
  secondaryText: { ...fonts.body, fontWeight: '600', color: theme.accent },
  disabled: { opacity: 0.6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  badgeText: { ...fonts.small, color: theme.muted },
});
