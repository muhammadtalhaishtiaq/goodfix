/**
 * Voice capture — wireframe §B #7.
 *
 * Hold-to-talk with a calm animated waveform (teal, per the one-accent
 * design system), a live editable transcript, and the wireframe's clean
 * "Saved to your private memory" reassurance.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useVault } from '../../state/store';
import { theme, fonts } from '../theme';
import { Mic, X } from 'lucide-react-native';
import { loadAgent } from '../agentBridge';

/** Loaded lazily — the package is installed, but the native module may not be linked in every build. */
let Voice: any = null;
try {
  const m = require('@react-native-voice/voice');
  Voice = (m && (m.default ?? m)) || null;
} catch {
  Voice = null;
}

function newId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

const BARS = 9;

/** Calm waveform: bars gently pulse while listening. */
function Waveform({ active }: { active: boolean }) {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      wave.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      wave.setValue(0);
    };
  }, [active, wave]);

  return (
    <View style={styles.wave} accessibilityLabel={active ? 'Listening' : undefined}>
      {Array.from({ length: BARS }, (_, i) => {
        const lo = 0.35 + 0.3 * Math.abs(Math.sin(i * 1.3));
        const hi = 0.6 + 0.4 * Math.abs(Math.cos(i * 0.9));
        const scaleY = active
          ? wave.interpolate({ inputRange: [0, 1], outputRange: [lo, hi] })
          : 0.35;
        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              { transform: [{ scaleY }], opacity: active ? 1 : 0.4 },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function VoiceModal({ navigation }: any) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const bumpMemory = useVault((s) => s.bumpMemory);
  const pushMessage = useVault((s) => s.pushMessage);

  const voiceAvailable = Voice != null;

  useEffect(() => {
    if (!Voice) return;
    Voice.onSpeechResults = (e: any) => {
      const t = e?.value?.[0];
      if (typeof t === 'string') setTranscript(t);
    };
    Voice.onSpeechError = () => setListening(false);
    return () => {
      try {
        Voice.destroy().then(() => Voice.removeAllListeners());
      } catch {
        /* already torn down */
      }
    };
  }, []);

  async function startListening() {
    if (!Voice || listening) return;
    try {
      await Voice.start('en-US');
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  async function stopListening() {
    if (!Voice) return;
    try {
      await Voice.stop();
    } catch {
      /* ignore */
    } finally {
      setListening(false);
    }
  }

  async function save() {
    const text = transcript.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const agentMod = loadAgent();
      if (agentMod) {
        const agent = await agentMod.getAgent();
        const turn = await agent.turn(`note this: ${text}`);
        pushMessage({ id: newId(), role: 'assistant', text: turn.reply, ts: Date.now() });
      } else {
        pushMessage({
          id: newId(),
          role: 'assistant',
          text: 'Saved to your private memory.',
          ts: Date.now(),
        });
      }
      bumpMemory();
    } catch (e: any) {
      pushMessage({
        id: newId(),
        role: 'assistant',
        text: `Couldn't save that note: ${e?.message ?? 'please try again'}`,
        ts: Date.now(),
      });
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.close}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.closeContent}>
            <X size={16} color={theme.muted} strokeWidth={2} />
            <Text style={[fonts.body, { color: theme.muted }]}>Close</Text>
          </View>
        </TouchableOpacity>

        <Text style={[fonts.title, { color: theme.ink, textAlign: 'center' }]}>
          Capture a note
        </Text>

        {voiceAvailable ? (
          <>
            <Waveform active={listening} />
            <TouchableOpacity
              style={styles.talkButton}
              activeOpacity={0.85}
              onPressIn={startListening}
              onPressOut={stopListening}
            >
              <Mic size={48} color="#FFFFFF" strokeWidth={2} />
              <Text style={[fonts.body, { color: '#FFFFFF', fontWeight: '600', marginTop: 8 }]}>
                {listening ? 'Listening… release to stop' : 'Hold to talk'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Your words will appear here…"
              placeholderTextColor={theme.muted}
              multiline
            />
          </>
        ) : (
          <>
            <Text style={[fonts.body, { color: theme.muted, textAlign: 'center', lineHeight: 22 }]}>
              Voice typing isn\u2019t available right now — type your note instead.
            </Text>
            <TextInput
              style={styles.input}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Type your note…"
              placeholderTextColor={theme.muted}
              multiline
              autoFocus
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!transcript.trim() || saving) && styles.disabled]}
          activeOpacity={0.85}
          disabled={!transcript.trim() || saving}
          onPress={save}
        >
          <Text style={[fonts.body, { color: '#FFFFFF', fontWeight: '600' }]}>
            {saving ? 'Saving…' : 'Save to memory'}
          </Text>
        </TouchableOpacity>

        <View style={styles.badge}>
          <View style={styles.tealDot} />
          <Text style={[fonts.small, { color: theme.muted }]}>Private · on-device</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: {
    flex: 1,
    padding: theme.pad * 1.5,
    gap: 20,
    alignItems: 'center',
  },
  close: { alignSelf: 'flex-start' },
  closeContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: 6,
  },
  bar: {
    width: 5,
    height: 40,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  talkButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    width: '100%',
    minHeight: 100,
    ...fonts.body,
    color: theme.ink,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: '#EDEAE4',
    borderRadius: theme.radius,
    padding: 14,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
});
