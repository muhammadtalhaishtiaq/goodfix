/**
 * BYOK (Bring Your Own Key) store — secure, device-only storage for the
 * user's own provider API keys (expo-secure-store = Keychain/Keystore).
 *
 * NOT wired into any turn flow in v0.1 (the app is local-only); this is the
 * store + honest tier labels for the future Settings UI. Keys never leave
 * the device through us — they go straight to the user's own provider
 * account when the BYOK tier ships.
 */
import * as SecureStore from 'expo-secure-store';
import type { PrivacyTier } from '../agent/types';

export type ByokProvider = 'anthropic' | 'openai';

function keyFor(provider: ByokProvider): string {
  return `vault_byok_${provider}`;
}

export class ByokStore {
  async setKey(provider: ByokProvider, key: string): Promise<void> {
    if (!key.trim()) throw new Error('byok: refusing to store an empty key');
    await SecureStore.setItemAsync(keyFor(provider), key);
  }

  async getKey(provider: ByokProvider): Promise<string | null> {
    return SecureStore.getItemAsync(keyFor(provider));
  }

  async clear(provider: ByokProvider): Promise<void> {
    await SecureStore.deleteItemAsync(keyFor(provider));
  }

  async hasKey(provider: ByokProvider): Promise<boolean> {
    const key = await this.getKey(provider);
    return key != null && key.length > 0;
  }
}

/** Honest per-tier label — the UI must always say where the data goes. */
export function tierLabel(tier: PrivacyTier): string {
  switch (tier) {
    case 'local':
      return 'Private · on-device';
    case 'byok':
      return 'Your key · leaves device to your account';
    case 'boost':
      return 'Boost · leaves device to our server';
  }
}
