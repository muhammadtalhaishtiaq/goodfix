/**
 * Vault design tokens. Calm, trustworthy, private:
 * soft off-white, one warm teal accent, generous whitespace.
 */
export const theme = {
  bg: '#FAF9F6',
  card: '#FFFFFF',
  ink: '#1A1A1A',
  muted: '#6B7280',
  accent: '#0F766E',
  accentSoft: '#E6F4F2',
  danger: '#DC2626',
  radius: 12,
  pad: 16,
} as const;

/** StyleSheet-friendly font sizes. */
export const fonts = {
  title: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 16 },
  small: { fontSize: 13 },
} as const;
