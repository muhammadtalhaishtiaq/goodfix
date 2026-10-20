/**
 * Network guard — pure function used to prove that Vault only ever talks to
 * the model-download host. The ONLY outbound traffic allowed in v0.1 is
 * downloading model weights from Hugging Face. downloadModel() in
 * src/inference/modelManager.ts calls assertLocalOnly(spec.url) before
 * creating any download task, so the guarantee is enforced at the one
 * network call site, not just asserted here. Everything else throws.
 *
 * Pure on purpose: trivially testable, no device APIs involved.
 */

const EXACT_HOSTS = new Set([
  'huggingface.co',
  'cdn-lfs.huggingface.co',
  'cas-bridge.xethub.huggingface.co',
]);

/** Matches '*.hf.co' — Hugging Face CDN subdomains. */
function isHfCdnSubdomain(host: string): boolean {
  return host.endsWith('.hf.co');
}

export function assertLocalOnly(url: string): void {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error(`networkGuard: blocked invalid URL "${url}"`);
  }
  if (EXACT_HOSTS.has(host) || isHfCdnSubdomain(host)) return;
  throw new Error(
    `networkGuard: blocked network request to "${host}" — only Hugging Face model downloads are allowed.`,
  );
}
