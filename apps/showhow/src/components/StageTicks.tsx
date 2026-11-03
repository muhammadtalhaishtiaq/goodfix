// Real progress (F9): each line ticks when the server reports that stage; the next one shows it is running.
const LABELS: Record<string, string> = {
  transcribed: 'Heard you',
  topic_rules: 'Topic rules passed',
  reviewed: 'Review passed',
  steps: 'Steps written in your words',
}

export function StageTicks({ done, order = Object.keys(LABELS) }: { done: string[]; order?: string[] }) {
  const current = order.find(s => !done.includes(s))
  return (
    <ol className="ticks" aria-live="polite">
      {order.map(s => (
        <li key={s} className={done.includes(s) ? 'done' : s === current ? 'run' : ''}>
          <span className="k" aria-hidden="true">{done.includes(s) ? '✓' : s === current ? '…' : '·'}</span>{LABELS[s] ?? s}
        </li>
      ))}
    </ol>
  )
}
