// Real progress (F9): each line ticks when the server reports that stage; the next one spins.
const LABELS: Record<string, string> = {
  transcribed: 'Heard you: Meta Voice Transcribe',
  topic_rules: 'Topic rules passed',
  reviewed: 'Meta Muse Spark review passed',
  steps: 'Steps written in your words',
}

export function StageTicks({ done, order = Object.keys(LABELS) }: { done: string[]; order?: string[] }) {
  const current = order.find(s => !done.includes(s))
  return (
    <ol className="ticks" aria-live="polite">
      {order.map(s => (
        <li key={s} className={done.includes(s) ? 'done' : s === current ? 'run' : ''}>
          <span className="tick" aria-hidden="true">{done.includes(s) ? '✓' : ''}</span>{LABELS[s] ?? s}
        </li>
      ))}
    </ol>
  )
}
