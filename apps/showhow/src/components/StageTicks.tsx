// Real progress (F9): each line ticks when the server reports that stage; the next one spins while it runs,
// or, once a check has failed, shows where it stopped.
const LABELS: Record<string, [running: string, done: string]> = {
  transcribed: ['Listening to your words…', 'Heard you'],
  topic_rules: ['Checking topic rules…', 'Topic rules passed'],
  reviewed: ['Reviewing it…', 'Review passed'],
  steps: ['Writing steps in your words…', 'Steps written in your words'],
}

export function StageTicks({ done, failed = false, order = Object.keys(LABELS) }: { done: string[]; failed?: boolean; order?: string[] }) {
  const current = order.find(s => !done.includes(s))
  return (
    <ol className="ticks" aria-live="polite">
      {order.map(s => {
        const [running, finished] = LABELS[s] ?? [s, s]
        const state = done.includes(s) ? 'done' : s === current ? (failed ? 'fail' : 'run') : ''
        return (
          <li key={s} className={state}>
            {state === 'run' ? <span className="spin" aria-hidden="true" /> : <span className="k" aria-hidden="true">{state === 'done' ? '✓' : state === 'fail' ? '✕' : '·'}</span>}
            {state === 'run' ? running : state === 'fail' ? `${running.replace('…', '')}: stopped here` : finished}
          </li>
        )
      })}
    </ol>
  )
}
