/**
 * Health check screen — a quick checkup to make sure everything is working,
 * runnable from the founder's phone.
 *
 * Three checks:
 *  1. Understanding test: runs 30 example requests through the real Router +
 *     engine and scores whether it picks the right action and the right
 *     details. Verdict PASS when ≥ 90% right actions and ≥ 85% right details.
 *  2. Speed test: times a short answer on the on-device model → words/sec.
 *  3. Memory test: saves 10 notes, recalls 3 queries, reports avg ms + hits.
 *
 * Everything is honest: missing pieces report as missing, never as passing.
 * Reachable from the Privacy screen's "Run health check" row — not a tab.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';
import { getEngine, getMemory } from '../../state/agent';
import { TOOLCALL_CASES, REFERENCE_NOW, scoreToolCall } from '../../diagnostics/spikes';

const TOOL_BAR = 90;
const ARGS_BAR = 85;
const REAL_ENGINE_NAME = 'llama.rn';

interface Failure {
  input: string;
  expected: string;
  got: string;
}

interface ToolState {
  running?: boolean;
  toolPct?: number;
  argsPct?: number;
  pass?: boolean;
  failures?: Failure[];
  /** Informational note shown alongside scores when the model isn't downloaded — not an error. */
  note?: string;
  error?: string;
}

interface SpeedState {
  running?: boolean;
  tokPerSec?: number;
  tokens?: number;
  secs?: number;
  note?: string;
  error?: string;
}

interface MemState {
  running?: boolean;
  avgMs?: number;
  hits?: number;
  notes?: number;
  note?: string;
  error?: string;
}

function BigButton({ label, onPress, running }: { label: string; onPress: () => void; running?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.button, running && styles.buttonDisabled]}
      onPress={onPress}
      disabled={running}
    >
      {running ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function Verdict({ pass }: { pass: boolean }) {
  return (
    <Text style={[styles.verdict, pass ? styles.pass : styles.fail]}>
      {pass ? 'PASS' : 'FAIL'}
    </Text>
  );
}

export default function DiagnosticsScreen() {
  const [tool, setTool] = useState<ToolState>({});
  const [speed, setSpeed] = useState<SpeedState>({});
  const [mem, setMem] = useState<MemState>({});

  const runToolSpike = async () => {
    setTool({ running: true });
    try {
      // @ts-ignore — src/agent/router.ts is built by the agent-core agent; resolved at runtime
      const routerMod = await import('../../agent/router');
      const RouterClass = routerMod.Router;
      if (typeof RouterClass !== 'function') {
        throw new Error('The understanding check isn\u2019t available right now.');
      }
      const engine = await getEngine();
      const demoMode = engine?.name !== REAL_ENGINE_NAME;
      const router = new RouterClass(engine);
      if (typeof router.route !== 'function') {
        throw new Error('Router has no route() method.');
      }
      let toolRight = 0;
      let argsRight = 0;
      const failures: Failure[] = [];
      for (const c of TOOLCALL_CASES) {
        let predicted = { tool: 'none', args: {} as Record<string, unknown> };
        try {
          // Spike runs against the fixed reference date (2026-09-20 08:00)
          // so relative utterances score deterministically.
          const decision = await router.route(c.input, REFERENCE_NOW);
          predicted = {
            tool: String(decision?.call?.tool ?? 'none'),
            args: (decision?.call?.args ?? {}) as Record<string, unknown>,
          };
        } catch {
          // routing threw → counts as wrong tool/args
        }
        const s = scoreToolCall(predicted, c);
        if (s.toolRight) toolRight += 1;
        if (s.argsRight) argsRight += 1;
        else
          failures.push({
            input: c.input,
            expected: `${c.expectedTool} ${JSON.stringify(c.expectedArgs)}`,
            got: `${predicted.tool} ${JSON.stringify(predicted.args)}`,
          });
      }
      const n = TOOLCALL_CASES.length;
      const toolPct = Math.round((toolRight / n) * 1000) / 10;
      const argsPct = Math.round((argsRight / n) * 1000) / 10;
      setTool({
        toolPct,
        argsPct,
        // In demo mode the scores reflect the deterministic fallback only —
        // never present them as a model-validation verdict.
        pass: demoMode ? undefined : toolPct >= TOOL_BAR && argsPct >= ARGS_BAR,
        failures: failures.slice(0, 10),
        note: demoMode
          ? 'The full model isn\u2019t downloaded yet, so these scores measure the built-in fallback — not the on-device model. No pass/fail is shown for fallback runs.'
          : undefined,
      });
    } catch (e: any) {
      setTool({ error: e?.message ?? String(e) });
    }
  };

  const runSpeed = async () => {
    setSpeed({ running: true });
    try {
      const eng: any = await getEngine();
      let name = 'unknown';
      let loaded = false;
      try {
        name = eng?.name ?? 'unknown';
        loaded = !!eng?.status?.().loaded;
      } catch {
        // keep defaults
      }
      if (name !== REAL_ENGINE_NAME || !loaded) {
        setSpeed({ note: 'Download the on-device model to run the speed test.' });
        return;
      }
      const t0 = Date.now();
      const out: string = await eng.complete(
        'Explain in one short paragraph why on-device AI keeps data private.',
        { maxTokens: 64 },
      );
      const secs = Math.max((Date.now() - t0) / 1000, 0.001);
      const tokens = String(out).split(/\s+/).filter(Boolean).length;
      setSpeed({ tokPerSec: Math.round((tokens / secs) * 10) / 10, tokens, secs: Math.round(secs * 100) / 100 });
    } catch (e: any) {
      setSpeed({ error: e?.message ?? String(e) });
    }
  };

  const runMemorySpike = async () => {
    setMem({ running: true });
    try {
      const memory = await getMemory();
      const stamp = Date.now();
      const tag = `[spike ${stamp}]`;
      for (let i = 0; i < 10; i++) {
        await memory.save(`${tag} diagnostic note ${i}: alpha beta gamma delta`, 'capture');
      }
      const queries = ['alpha beta', 'diagnostic note', 'gamma delta'];
      let totalMs = 0;
      let hits = 0;
      for (const q of queries) {
        const s = Date.now();
        const r = await memory.recall(q, 5);
        totalMs += Date.now() - s;
        hits += r.length;
      }
      // Clean up after ourselves.
      try {
        const all = await memory.list(200);
        for (const n of all) {
          if (n.body.includes(tag)) {
            try {
              await memory.remove(n.id);
            } catch {
              // best effort cleanup
            }
          }
        }
      } catch {
        // best effort cleanup
      }
      setMem({ avgMs: Math.round((totalMs / queries.length) * 10) / 10, hits, notes: 10 });
    } catch (e: any) {
      setMem({ error: e?.message ?? String(e) });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Health check</Text>
      <Text style={styles.sub}>A quick checkup to make sure everything is working.</Text>

      {/* Understanding test */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Understanding test · 30 examples</Text>
        <BigButton label="Run understanding test" onPress={runToolSpike} running={tool.running} />
        {tool.toolPct !== undefined ? (
          <>
            {tool.note ? <Text style={styles.note}>{tool.note}</Text> : null}
            <View style={styles.row}>
              <Text style={styles.metric}>Right action: {tool.toolPct}% (needs {TOOL_BAR}%)</Text>
              <Text style={styles.metric}>Right details: {tool.argsPct}% (needs {ARGS_BAR}%)</Text>
            </View>
            {tool.pass !== undefined ? <Verdict pass={tool.pass} /> : null}
            {(tool.failures ?? []).map((f, i) => (
              <View key={i} style={styles.failure}>
                <Text style={styles.failureInput}>“{f.input}”</Text>
                <Text style={styles.failureLine}>expected: {f.expected}</Text>
                <Text style={styles.failureLine}>got: {f.got}</Text>
              </View>
            ))}
          </>
        ) : tool.error ? (
          <Text style={styles.error}>{tool.error}</Text>
        ) : null}
      </View>

      {/* Speed test */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Speed test</Text>
        <BigButton label="Run speed test" onPress={runSpeed} running={speed.running} />
        {speed.error ? (
          <Text style={styles.error}>{speed.error}</Text>
        ) : speed.note ? (
          <Text style={styles.note}>{speed.note}</Text>
        ) : speed.tokPerSec !== undefined ? (
          <Text style={styles.metric}>
            ≈{speed.tokPerSec} words per second · {speed.tokens} words in {speed.secs}s
          </Text>
        ) : null}
      </View>

      {/* Memory test */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Memory test · 10 notes</Text>
        <BigButton label="Run memory test" onPress={runMemorySpike} running={mem.running} />
        {mem.error ? (
          <Text style={styles.error}>{mem.error}</Text>
        ) : mem.avgMs !== undefined ? (
          <Text style={styles.metric}>
            Found {mem.hits} matches across {mem.notes} notes · average {mem.avgMs} ms
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: theme.pad,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.ink,
  },
  sub: {
    fontSize: 14,
    color: theme.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: theme.pad,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.ink,
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    marginBottom: 8,
  },
  metric: {
    fontSize: 15,
    color: theme.ink,
    fontWeight: '600',
    marginBottom: 4,
  },
  verdict: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 8,
  },
  pass: {
    color: theme.accent,
  },
  fail: {
    color: theme.danger,
  },
  error: {
    fontSize: 14,
    color: theme.danger,
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    color: theme.muted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  failure: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  failureInput: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.ink,
  },
  failureLine: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 2,
  },
});
