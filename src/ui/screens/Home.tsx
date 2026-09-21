import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useVault, ChatMessage } from '../../state/store';
import { theme, fonts } from '../theme';
import { Mic, PencilLine, AlarmClock, Brain } from 'lucide-react-native';
import { loadAgent } from '../agentBridge';
import ActionConfirmModal from '../components/ActionConfirmModal';

const CHIPS = [
  { label: 'Note this', icon: PencilLine, prefix: 'Note this: ' },
  { label: 'Remind me', icon: AlarmClock, prefix: 'Remind me to ' },
  { label: 'What did I say about…', icon: Brain, prefix: 'What did I say about ' },
] as const;

function newId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[fonts.body, { color: theme.ink, lineHeight: 22 }]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default function Home({ navigation }: any) {
  const messages = useVault((s) => s.messages);
  const pushMessage = useVault((s) => s.pushMessage);
  const setPendingConfirm = useVault((s) => s.setPendingConfirm);
  const alwaysAllowed = useVault((s) => s.alwaysAllowed);
  const bumpMemory = useVault((s) => s.bumpMemory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  /** Runs an agent turn; extracted so an edited confirmation can re-run it. */
  async function runTurn(agentMod: any, text: string) {
    const agent = await agentMod.getAgent();
    const turn = await agent.turn(text);
    pushMessage({ id: newId(), role: 'assistant', text: turn.reply, ts: Date.now() });

    if (turn.confirmRequired) {
      const actionKind: string | undefined =
        typeof (turn as any).actionKind === 'string' ? (turn as any).actionKind : undefined;
      const approveNow = async () => {
        try {
          if (turn.approve) {
            const t2 = await turn.approve();
            pushMessage({ id: newId(), role: 'assistant', text: t2.reply, ts: Date.now() });
            bumpMemory();
          }
        } catch (e: any) {
          pushMessage({
            id: newId(),
            role: 'assistant',
            text: `I couldn't complete that: ${e?.message ?? 'something went wrong'}`,
            ts: Date.now(),
          });
        } finally {
          setPendingConfirm(null);
        }
      };
      // The user previously chose "always allow" for this kind of action —
      // skip the sheet and proceed, exactly as they asked.
      if (actionKind && alwaysAllowed.includes(actionKind)) {
        await approveNow();
        return;
      }
      setPendingConfirm({
        prompt: turn.confirmPrompt ?? 'Do you want me to go ahead with this action?',
        actionKind,
        approve: approveNow,
        reject: () => {
          try {
            turn.reject?.();
          } finally {
            setPendingConfirm(null);
          }
        },
        editAsNew: (edited) => {
          try {
            turn.reject?.();
          } finally {
            setPendingConfirm(null);
          }
          // The edited version becomes a fresh request — nothing from the
          // original proposal is acted on.
          void send(edited);
        },
      });
    }
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    pushMessage({ id: newId(), role: 'user', text, ts: Date.now() });

    const agentMod = loadAgent();
    if (!agentMod) {
      pushMessage({
        id: newId(),
        role: 'assistant',
        text: "I've saved your message — I'm still getting set up, so I can't act on it just yet.",
        ts: Date.now(),
      });
      setSending(false);
      return;
    }

    try {
      await runTurn(agentMod, text);
    } catch (e: any) {
      pushMessage({
        id: newId(),
        role: 'assistant',
        text: `Something went wrong on my end: ${e?.message ?? 'please try again'}`,
        ts: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  const ConfirmModal = ActionConfirmModal;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.tealDot} />
          <Text style={[fonts.small, { color: theme.muted }]}>Private · on-device</Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[fonts.title, { color: theme.ink, textAlign: 'center' }]}>
              What can I do for you?
            </Text>
            <Text style={[fonts.body, { color: theme.muted, textAlign: 'center', marginTop: 8 }]}>
              Ask me to remember things, remind you, or find what you told me before.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.list}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={styles.chip}
              activeOpacity={0.8}
              onPress={() => setInput(chip.prefix)}
            >
              <View style={styles.chipContent}>
                <chip.icon size={15} color={theme.accent} strokeWidth={2} />
                <Text style={[fonts.small, { color: theme.accent, fontWeight: '600' }]}>
                  {chip.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.micButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VoiceModal')}
          >
            <Mic size={22} color={theme.accent} strokeWidth={2} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask or tell me anything…"
            placeholderTextColor={theme.muted}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendDisabled]}
            activeOpacity={0.85}
            disabled={!input.trim() || sending}
            onPress={() => send(input)}
          >
            <Text style={[fonts.body, { color: '#FFFFFF', fontWeight: '600' }]}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.pad,
    paddingVertical: 10,
  },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: theme.pad * 2 },
  list: { padding: theme.pad, gap: 10 },
  row: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: theme.accentSoft },
  bubbleAssistant: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: '#EDEAE4',
  },
  chips: { paddingHorizontal: theme.pad, paddingVertical: 8, gap: 8 },
  chip: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.accentSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.pad,
    gap: 8,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...fonts.body,
    color: theme.ink,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: '#EDEAE4',
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingHorizontal: 18,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
