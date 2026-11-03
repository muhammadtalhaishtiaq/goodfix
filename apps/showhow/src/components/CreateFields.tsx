// Shared bits of both Create flows: optional title/category (AI fills blanks, F5/F6), name, the access-code
// explanation (F3), the "How we check" explainer (F2), the "who keeps what" consent table, and the review-screen editor.
import type { ReactNode } from 'react'
import { CATEGORIES, type Category } from '../lib/categories'

export type CategoryChoice = Category | 'auto'

type FieldsProps = {
  title: string; setTitle: (v: string) => void
  category: CategoryChoice; setCategory: (v: CategoryChoice) => void
  creatorName: string; setCreatorName: (v: string) => void
  code: string; setCode: (v: string) => void
  source: 'video' | 'voice'
}

export function GuideFields({ title, setTitle, category, setCategory, creatorName, setCreatorName, code, setCode, source }: FieldsProps) {
  return (
    <div className="form-grid">
      <label className="fl">Guide title <span className="hint">Optional: AI writes it from your {source === 'video' ? 'narration' : 'words'}</span>
        <input className="txt" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="Leave blank" />
      </label>
      <label className="fl">Category <span className="hint">Optional</span>
        <select className="txt" value={category} onChange={e => setCategory(e.target.value as CategoryChoice)}>
          <option value="auto">Let AI choose</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="fl">Your name <span className="hint">Shown on the guide</span>
        <input className="txt" value={creatorName} maxLength={60} onChange={e => setCreatorName(e.target.value)} />
      </label>
      <label className="fl">Access code
        <span id="code-help" className="hint">Creating guides needs a code, because every guide uses paid AI credits and becomes public. Watching guides and “I’m stuck” checks don’t need one. Hackathon judges: your code is in our submission notes.</span>
        <input className="txt" type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} aria-describedby="code-help" />
      </label>
    </div>
  )
}

export function HowWeCheck({ source }: { source: 'video' | 'voice' }) {
  return (
    <details className="how">
      <summary>How we check your {source === 'video' ? 'video' : 'recording'} before anything is published</summary>
      <ol>
        <li><b>Your words become text</b> with Meta Voice Transcribe.</li>
        <li><b>Hard topic rules</b> (our own code, not AI) block weapons, violence, self-harm, drugs, gas or mains-electrical work, fire, medical procedures, vehicle brakes, hacking, illegal acts, adult content, hate or harassment, and personal details like phone numbers, emails or card numbers.</li>
        <li><b>Meta Muse Spark reviews it</b>: is it suitable for a public audience, and is it really a how-to? If the check can’t run, the {source === 'video' ? 'guide is blocked' : 'recording is blocked'}. We never guess.</li>
        {source === 'video' && <li><b>The frames are checked too</b>: one still per step is reviewed for anything unsuitable to publish (nudity, weapons, ID or bank cards…).</li>}
        <li>Only then are steps written, always in <b>your own words</b>, and you review everything before publishing.</li>
      </ol>
      {source === 'voice' && <p className="muted">Your recording itself is never stored. If it doesn’t pass, nothing is kept at all.</p>}
    </details>
  )
}

export type Recipient = { who: string; what: ReactNode; keeps: string }

// Ruled "who keeps what" table (UI-AUDIT §5): Who · What happens · Keeps it?
export function WhoKeepsWhat({ rows }: { rows: Recipient[] }) {
  return (
    <table className="ctable">
      <caption>Before anything leaves your device</caption>
      <thead><tr><th scope="col">Who</th><th scope="col">What happens</th><th scope="col">Keeps it?</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.who}><th scope="row">{r.who}</th><td>{r.what}</td><td><span className="mono">{r.keeps}</span></td></tr>)}</tbody>
    </table>
  )
}

export type Duplicate = { id: string; title: string; creatorName: string; similarity: number; adds: string; sameCreator: boolean }
export type ReviewMeta = { title: string; category: Category; missing: string[]; duplicate?: Duplicate | null }

export function ReviewMetaEditor({ meta, onChange }: { meta: ReviewMeta; onChange: (m: ReviewMeta) => void }) {
  return (
    <div className="review-meta">
      <label className="fl">Title<input className="txt" value={meta.title} maxLength={120} onChange={e => onChange({ ...meta, title: e.target.value })} /></label>
      <label className="fl">Category
        <select className="txt" value={meta.category} onChange={e => onChange({ ...meta, category: e.target.value as Category })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
      </label>
      {meta.duplicate && (
        <p className="note span2">
          {meta.duplicate.sameCreator ? 'You published something very similar before: ' : 'A very similar guide already exists: '}
          <a href={`#/guide/${meta.duplicate.id}/1`} target="_blank" rel="noreferrer">“{meta.duplicate.title}”</a> by {meta.duplicate.creatorName} ({meta.duplicate.similarity}% similar).
          {meta.duplicate.adds ? ` Yours adds: ${meta.duplicate.adds}.` : ''} {meta.duplicate.sameCreator ? 'Did you mean to update it? ' : ''}You can still publish yours: different people’s ways often help.
        </p>
      )}
      {meta.missing.length > 0 && <p className="note warn-note span2">The AI thinks you may have skipped: {meta.missing.join('; ')}. Add it to an instruction below, or record again.</p>}
    </div>
  )
}
