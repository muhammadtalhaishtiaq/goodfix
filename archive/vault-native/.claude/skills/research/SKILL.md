---
name: research
description: Dispatch market/competitor/technical/regulatory research to the researcher agent(s) and integrate the findings back into the docs.
---

# /research — Research & integrate

Get decision-useful research and fold it into the product docs. Don't just collect — synthesize and save.

1. **Frame it.** Turn the request into a sharp question + a definition of done. If it's broad, split into independent streams (competitors / feasibility / market+risk / model economics).
2. **Dispatch.** Launch one `researcher` agent per independent stream (in parallel). Give each: the question, product context, and "be skeptical, cite URLs, label verified vs inferred."
3. **Verify the load-bearing facts yourself** with WebSearch/WebFetch — subagents may be blocked from the web, and the highest-stakes claims (legal, competitive, pricing) deserve a direct check.
4. **Synthesize** into a short verdict: what's true, what it means, what to do. Lead with the answer.
5. **Save what's durable** — append to the relevant doc (`docs/PRODUCT.md` open decisions, or a `docs/research/<topic>.md` file). Note anything still unverified.

Be honest and non-sycophantic: surface threats and disconfirming evidence, not just support.
