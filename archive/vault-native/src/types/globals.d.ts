/**
 * Metro (React Native) provides a global `require` at runtime.
 * Declared here so TypeScript accepts the lazy require() calls used to load
 * modules that are being built in parallel (agent, model manager, screens,
 * voice). No new npm packages needed.
 */
declare function require(id: string): any;
