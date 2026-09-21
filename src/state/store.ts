import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

export type ModelState = 'idle' | 'downloading' | 'ready' | 'error';

/** A pending user confirmation for a side-effecting agent action. */
export interface PendingConfirm {
  prompt: string;
  /** Coarse action kind (e.g. 'reminder', 'note') — enables "always allow". */
  actionKind?: string;
  approve: () => void;
  reject: () => void;
  /**
   * Called when the user edits the preview and sends the edited version
   * instead — the original action is discarded and the edited text is
   * handled as a fresh request.
   */
  editAsNew?: (editedPrompt: string) => void;
}

interface VaultState {
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;

  modelState: ModelState;
  modelProgress: number;
  modelError?: string;
  setModelState: (s: ModelState, progress?: number, error?: string) => void;

  messages: ChatMessage[];
  pushMessage: (m: ChatMessage) => void;
  clearMessages: () => void;

  /** Incremented whenever the memory view should refresh. */
  memoryBump: number;
  bumpMemory: () => void;

  /** Incremented whenever the privacy audit view should refresh. */
  auditBump: number;
  bumpAudit: () => void;

  /** Set by Home when the agent needs explicit user confirmation. */
  pendingConfirm: PendingConfirm | null;
  setPendingConfirm: (p: PendingConfirm | null) => void;

  /** Action kinds the user chose to "always allow" (trust gate checkbox). */
  alwaysAllowed: string[];
  allowAlways: (kind: string) => void;
}

export const useVault = create<VaultState>((set) => ({
  onboarded: false,
  setOnboarded: (v) => set({ onboarded: v }),

  modelState: 'idle',
  modelProgress: 0,
  modelError: undefined,
  setModelState: (s, progress = 0, error) =>
    set({ modelState: s, modelProgress: progress, modelError: error }),

  messages: [],
  pushMessage: (m) => set((st) => ({ messages: [...st.messages, m] })),
  clearMessages: () => set({ messages: [] }),

  memoryBump: 0,
  bumpMemory: () => set((st) => ({ memoryBump: st.memoryBump + 1 })),

  auditBump: 0,
  bumpAudit: () => set((st) => ({ auditBump: st.auditBump + 1 })),

  pendingConfirm: null,
  setPendingConfirm: (p) => set({ pendingConfirm: p }),

  alwaysAllowed: [],
  allowAlways: (kind) =>
    set((st) => (st.alwaysAllowed.includes(kind) ? st : { alwaysAllowed: [...st.alwaysAllowed, kind] })),
}));
