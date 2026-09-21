/**
 * ActionConfirmModal — the trust gate (wireframe §B #10).
 *
 * Bottom-sheet presentation: a preview of the exact content the agent wants
 * to act on, three buttons (Confirm, Edit, Cancel), and an "Always allow this
 * kind of action" checkbox (shown when the action has a known kind).
 *
 * Edit opens the preview for tweaking; "Use this instead" discards the
 * original proposal and sends the edited text as a fresh request, so the
 * user always approves exactly what they see.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useVault } from '../../state/store';
import { Check } from 'lucide-react-native';
import { theme } from '../theme';

function settle(fn: () => void, done: () => void) {
  try {
    const r = fn() as unknown;
    if (r instanceof Promise) {
      r.then(done, done);
      return;
    }
  } catch {
    // fall through to close the sheet regardless
  }
  done();
}

export default function ActionConfirmModal() {
  const pendingConfirm = useVault((s) => s.pendingConfirm);
  const setPendingConfirm = useVault((s) => s.setPendingConfirm);
  const allowAlways = useVault((s) => s.allowAlways);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [always, setAlways] = useState(false);

  // Reset local state each time a new confirmation arrives.
  useEffect(() => {
    if (pendingConfirm) {
      setEditing(false);
      setDraft(pendingConfirm.prompt);
      setAlways(false);
    }
  }, [pendingConfirm]);

  if (!pendingConfirm) return null;
  const close = () => setPendingConfirm(null);

  const doConfirm = () => {
    if (always && pendingConfirm.actionKind) {
      allowAlways(pendingConfirm.actionKind);
    }
    settle(pendingConfirm.approve, close);
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={close}
          accessibilityLabel="Dismiss"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {editing ? 'Edit the action' : 'Please confirm'}
          </Text>

          {editing ? (
            <>
              <TextInput
                style={styles.editor}
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                accessibilityLabel="Edit the action text"
              />
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.ghostBtn]}
                  onPress={() => setEditing(false)}
                  accessibilityLabel="Back to preview"
                >
                  <Text style={styles.ghostText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn, !draft.trim() && styles.btnDisabled]}
                  disabled={!draft.trim()}
                  onPress={() => {
                    const send = pendingConfirm.editAsNew;
                    const text = draft.trim();
                    close();
                    if (send && text) send(text);
                  }}
                  accessibilityLabel="Use the edited version instead"
                >
                  <Text style={styles.confirmText}>Use this instead</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.preview}>
                <Text style={styles.prompt}>{pendingConfirm.prompt}</Text>
              </View>

              {pendingConfirm.actionKind ? (
                <TouchableOpacity
                  style={styles.checkRow}
                  activeOpacity={0.8}
                  onPress={() => setAlways((a) => !a)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: always }}
                  accessibilityLabel="Always allow this kind of action"
                >
                  <View style={[styles.checkbox, always && styles.checkboxOn]}>
                    {always && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                  </View>
                  <Text style={styles.checkLabel}>Always allow this kind of action</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.ghostBtn]}
                  onPress={() => settle(pendingConfirm.reject, close)}
                  accessibilityLabel="Cancel action"
                >
                  <Text style={styles.ghostText}>Cancel</Text>
                </TouchableOpacity>
                {pendingConfirm.editAsNew ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.editBtn]}
                    onPress={() => setEditing(true)}
                    accessibilityLabel="Edit action"
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={doConfirm}
                  accessibilityLabel="Confirm action"
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: theme.radius,
    borderTopRightRadius: theme.radius,
    padding: theme.pad * 1.5,
    paddingBottom: theme.pad * 2,
    maxHeight: '80%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E1D8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.ink,
    marginBottom: 12,
  },
  preview: {
    backgroundColor: theme.bg,
    borderRadius: theme.radius,
    padding: theme.pad,
    marginBottom: 12,
  },
  prompt: {
    fontSize: 16,
    color: theme.ink,
    lineHeight: 22,
  },
  editor: {
    backgroundColor: theme.bg,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.accentSoft,
    padding: theme.pad,
    fontSize: 16,
    color: theme.ink,
    lineHeight: 22,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: theme.accent },
  checkLabel: { fontSize: 14, color: theme.muted },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    borderRadius: theme.radius,
    paddingVertical: 13,
    paddingHorizontal: 20,
    minWidth: 96,
    alignItems: 'center',
  },
  ghostBtn: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ghostText: { fontSize: 16, fontWeight: '600', color: theme.muted },
  editBtn: { backgroundColor: theme.accentSoft },
  editText: { fontSize: 16, fontWeight: '600', color: theme.accent },
  confirmBtn: { backgroundColor: theme.accent },
  confirmText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.5 },
});
