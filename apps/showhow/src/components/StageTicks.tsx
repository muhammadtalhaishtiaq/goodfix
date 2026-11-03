// Real progress (F9): each line ticks when the server reports that stage; the next one spins while it runs.
const LABELS: Record<string, [running: string, done: string]> = {
  transcribed: ['Listening to your words…', 'Heard you'],
  topic_rules: ['Checking topic rules…', 'Topic rules passed'],
  reviewed: ['Reviewing it…', 'Review passed'],
  steps: ['Writing steps in your words…', 'Steps written in your words'],
}

export function StageTicks({ done, order = Object.keys(LABELS) }: { done: string[]; order?: string[] }) {
  const current = order.find(s => !done.includes(s))
  return (
    <ol className="ticks" aria-live="polite">
      {order.map(s => {
        const [running, finished] = LABELS[s] ?? [s, s]
        const state = done.includes(s) ? 'done' : s === current ? 'run' : ''
        return (
          <li key={s} className={state}>
            {state === 'run' ? <span className="spin" aria-hidden="true" /> : <span className="k" aria-hidden="true">{state ? '✓' : '·'}</span>}
            {state === 'run' ? running : finished}
          </li>
        )
      })}
    </ol>
  )
}
