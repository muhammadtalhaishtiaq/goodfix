/**
 * Memory screen — wireframe §E #15b: "What it knows about me".
 *
 * Searchable timeline grouped by category (Reminders / Events / Notes /
 * Captured), newest-first within each group. Notes can be edited or deleted.
 * Everything is stored only on this device.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVault } from '../../state/store';
import { theme } from '../theme';
import { getMemory } from '../../state/agent';
import type { MemoryNote } from '../../memory/types';

const SNIPPET_LEN = 140;

/** Display order + labels for the kind groups (wireframe #15b categories). */
const GROUPS: { kind: string; label: string }[] = [
  { kind: 'reminder', label: 'Reminders' },
  { kind: 'event', label: 'Events' },
  { kind: 'note', label: 'Notes' },
  { kind: 'capture', label: 'Captured' },
];

function groupLabel(kind: string): string {
  return GROUPS.find((g) => g.kind === kind)?.label ?? 'Notes';
}

function snippet(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > SNIPPET_LEN ? flat.slice(0, SNIPPET_LEN) + '…' : flat;
}

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

interface RowItem {
  key: string;
  kind: 'header' | 'note';
  label?: string;
  note?: MemoryNote;
}

/** Newest-first notes → section rows for the grouped timeline. */
function toRows(notes: MemoryNote[]): RowItem[] {
  const rows: RowItem[] = [];
  const rest: MemoryNote[] = [];
  for (const g of GROUPS) {
    const inGroup = notes.filter((n) => n.kind === g.kind);
    if (inGroup.length > 0) {
      rows.push({ key: `header-${g.kind}`, kind: 'header', label: g.label });
      for (const n of inGroup) rows.push({ key: n.id, kind: 'note', note: n });
    }
  }
  for (const n of notes) {
    if (!GROUPS.some((g) => g.kind === n.kind)) rest.push(n);
  }
  if (rest.length > 0) {
    rows.push({ key: 'header-other', kind: 'header', label: 'Other' });
    for (const n of rest) rows.push({ key: n.id, kind: 'note', note: n });
  }
  return rows;
}

export default function MemoryScreen() {
  const memoryBump = useVault((s) => s.memoryBump);
  const bumpMemory = useVault((s) => s.bumpMemory);
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const mem = await getMemory();
      if (q && q.trim().length > 0) {
        const hits = await mem.recall(q.trim(), 20);
        setNotes(hits.map((h) => h.note));
        setSearching(true);
      } else {
        setNotes(await mem.list(100));
        setSearching(false);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not load memory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, memoryBump]),
  );

  const onSearch = () => load(query);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete note?', 'This permanently deletes the note from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const mem = await getMemory();
            await mem.remove(id);
            bumpMemory();
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  const startEdit = (note: MemoryNote) => {
    setDraft(note.body);
    setEditingId(note.id);
  };

  const saveEdit = async (id: string) => {
    const text = draft.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      const mem = await getMemory();
      await mem.update(id, text);
      setEditingId(null);
      bumpMemory();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Please try again');
    } finally {
      setSavingEdit(false);
    }
  };

  const renderRow = ({ item }: { item: RowItem }) => {
    if (item.kind === 'header') {
      return <Text style={styles.sectionHeader}>{item.label}</Text>;
    }
    const note = item.note!;
    const expanded = expandedId === note.id;
    const editing = editingId === note.id;
    return (
      <TouchableOpacity
        style={styles.noteCard}
        activeOpacity={0.7}
        onPress={() => !editing && setExpandedId(expanded ? null : note.id)}
      >
        <View style={styles.noteHeader}>
          <Text style={styles.kindBadge}>{groupLabel(note.kind)}</Text>
          <Text style={styles.date}>{fmtDate(note.createdAt)}</Text>
        </View>
        {editing ? (
          <>
            <TextInput
              style={styles.editor}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              accessibilityLabel="Edit note"
            />
            <View style={styles.editRow}>
              <TouchableOpacity
                style={styles.editCancel}
                onPress={() => setEditingId(null)}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSave, (!draft.trim() || savingEdit) && styles.disabled]}
                disabled={!draft.trim() || savingEdit}
                onPress={() => saveEdit(note.id)}
              >
                <Text style={styles.editSaveText}>
                  {savingEdit ? 'Saving…' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.body}>{expanded ? note.body : snippet(note.body)}</Text>
            {expanded && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => startEdit(note)}
                  accessibilityLabel="Edit note"
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => confirmDelete(note.id)}
                  accessibilityLabel="Delete note"
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const rows: RowItem[] = searching
    ? notes.map((n) => ({ key: n.id, kind: 'note' as const, note: n }))
    : toRows(notes);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What it knows about me</Text>
        <View style={styles.badge}>
          <View style={styles.tealDot} />
          <Text style={styles.badgeText}>Private · on-device</Text>
        </View>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search your memory…"
        placeholderTextColor={theme.muted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {loading ? (
        <ActivityIndicator style={styles.center} color={theme.accent} />
      ) : error ? (
        <Text style={[styles.center, styles.error]}>{error}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            searching ? <Text style={styles.searchNote}>Showing recall matches</Text> : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searching ? 'No matches found.' : 'Nothing saved yet. Capture something from Home.'}
            </Text>
          }
        />
      )}
      <Text style={styles.footer}>
        Your memory lives in .md files on this phone — open, read, delete anytime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: theme.pad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  badgeText: { fontSize: 13, color: theme.muted },
  search: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    paddingHorizontal: theme.pad,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.ink,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  center: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  error: {
    color: theme.danger,
    fontSize: 15,
  },
  list: {
    paddingBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  searchNote: {
    color: theme.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  empty: {
    color: theme.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  noteCard: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: theme.pad,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  kindBadge: {
    backgroundColor: theme.accentSoft,
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: 8,
  },
  date: {
    color: theme.muted,
    fontSize: 12,
  },
  body: {
    color: theme.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  editor: {
    color: theme.ink,
    fontSize: 15,
    lineHeight: 21,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.accentSoft,
    borderRadius: theme.radius,
    padding: 12,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  editCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius,
  },
  editCancelText: { color: theme.muted, fontSize: 14, fontWeight: '600' },
  editSave: {
    backgroundColor: theme.accent,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: theme.radius,
  },
  editSaveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    color: theme.muted,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 8,
  },
});
