import { Router } from '../src/agent/router';
import {
  TOOLCALL_CASES,
  REFERENCE_NOW,
  scoreToolCall,
} from '../src/diagnostics/spikes';

describe('spike fallback gate', () => {
  it('deterministic fallback meets the Phase-0 bars (>=90% tool, >=85% args)', async () => {
    const router = new Router(null);
    let toolRight = 0;
    let argsRight = 0;
    const failures: string[] = [];
    for (const c of TOOLCALL_CASES) {
      const decision = await router.route(c.input, REFERENCE_NOW);
      const predicted = {
        tool: String(decision.call.tool),
        args: decision.call.args,
      };
      const s = scoreToolCall(predicted, c);
      if (s.toolRight) toolRight += 1;
      if (s.argsRight) argsRight += 1;
      else
        failures.push(
          `"${c.input}" expected ${c.expectedTool} got ${predicted.tool} ${JSON.stringify(predicted.args)}`,
        );
    }
    const n = TOOLCALL_CASES.length;
    const toolPct = toolRight / n;
    const argsPct = argsRight / n;
    // eslint-disable-next-line no-console
    console.log(`fallback toolRight=${toolRight}/${n} argsRight=${argsRight}/${n}`);
    for (const f of failures) console.log('  FAIL:', f);
    expect(toolPct).toBeGreaterThanOrEqual(0.9);
    expect(argsPct).toBeGreaterThanOrEqual(0.85);
  });
});
