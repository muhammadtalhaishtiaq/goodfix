import { useState, type FormEvent } from 'react'
import { NOT_COVERED, type AskAnswer } from '../lib/ask'
import { askStep } from '../lib/data'
import './ask.css'

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'answer'; a: AskAnswer } | { kind: 'error'; message: string }

// "Ask about this step" (F13+). Keyed by guide + step so everything resets when the learner moves on.
export function AskPanel({ guideId, stepIdx }: { guideId: string; stepIdx: number }) {
  return <AskForm key={`${guideId}:${stepIdx}`} guideId={guideId} stepIdx={stepIdx} />
}

function AskForm({ guideId, stepIdx }: { guideId: string; stepIdx: number }) {
  const [question, setQuestion] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const q = question.trim()

  async function ask(e?: FormEvent) {
    e?.preventDefault()
    if (!q || state.kind === 'loading') return
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'answer', a: await askStep(guideId, stepIdx, q) })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message || 'Something went wrong. Please try again.' })
    }
  }

  return (
    <section className="ask-panel">
      <h3>Ask about this step</h3>
      <form className="ask" onSubmit={ask}>
        <input value={question} onChange={e => setQuestion(e.target.value)} maxLength={300} placeholder="Type a question" aria-label="Your question" />
        <button type="submit" className="ask-btn" disabled={!q || state.kind === 'loading'}>{state.kind === 'loading' ? 'Asking…' : 'Ask'}</button>
      </form>
      <div aria-live="polite">
        {state.kind === 'answer' && (state.a.covered
          ? state.a.quotes.map(q => (
            <blockquote className="ask-answer" key={q.step}>
              <span className="ask-mono">The creator says · step {q.step + 1}</span>
              <p>“{q.text}”</p>
              {q.tip && <p className="ask-tip">Tip: “{q.tip}”</p>}
            </blockquote>
          ))
          : <p className="ask-answer"><span className="ask-mono">Not in this guide</span>{guideId.startsWith('fixture-') ? 'TEST FIXTURE: no model was called.' : NOT_COVERED}</p>
        )}
        {state.kind === 'error' && (
          <div className="ask-error">
            <p>{state.message}</p>
            <button type="button" className="ask-btn ask-btn-line" onClick={() => ask()}>Try again</button>
          </div>
        )}
      </div>
      <p className="ask-note">Answers are the creator’s own words from this guide. Your question goes to Meta Muse Spark (storage off) to find the right step; Showhow doesn’t save it. 18+.</p>
    </section>
  )
}
