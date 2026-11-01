// Shared bits of both Create flows: optional title/category (AI fills blanks, F5/F6), the access-code
// explanation (F3), the "How we check" explainer (F2), and the review-screen title/category editor.
import { CATEGORIES, type Category } from '../lib/categories'
import { Icon } from './Icon'

export type CategoryChoice = Category | 'auto'

type FieldsProps = {
  title: string; setTitle: (v: string) => void
  category: CategoryChoice; setCategory: (v: CategoryChoice) => void
  code: string; setCode: (v: string) => void
  source: 'video' | 'voice'
}

export function GuideFields({ title, setTitle, category, setCategory, code, setCode, source }: FieldsProps) {
  return (
    <>
      <label className="fl">Guide title <span className="muted">(optional)</span>
        <input className="txt" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder={`Leave blank: AI writes it from your ${source === 'video' ? 'narration' : 'words'}`} />
      </label>
      <label className="fl">Category
        <select className="txt" value={category} onChange={e => setCategory(e.target.value as CategoryChoice)}>
          <option value="auto">Let AI choose</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="fl">Access code
        <input className="txt" type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} aria-describedby="code-help" />
        <span id="code-help" className="hint">Creating guides needs a code, because every guide uses paid AI credits and becomes public. Watching guides and “I’m stuck” checks don’t need one. Hackathon judges: your code is in our submission notes.</span>
      </label>
    </>
  )
}

export function HowWeCheck({ source }: { source: 'video' | 'voice' }) {
  return (
    <details className="span2 how-check">
      <summary><Icon name="shield" /> How we check your {source === 'video' ? 'video' : 'recording'} before anything is published</summary>
      <ol>
        <li><b>Your words become text</b> with Meta Voice Transcribe.</li>
        <li><b>Hard topic rules</b> (our own code, not AI) block weapons, violence, self-harm, drugs, gas or mains-electrical work, fire, medical procedures, vehicle brakes, hacking, illegal acts, adult content, hate or harassment, and personal details like phone numbers, emails or card numbers.</li>
        <li><b>Meta Muse Spark reviews it</b>: is it safe for a public audience, and is it really a how-to? If the check can’t run, the {source === 'video' ? 'guide is blocked' : 'recording is blocked'}. We never guess.</li>
        {source === 'video' && <li><b>The frames are checked too</b>: one still per step is reviewed for anything unsuitable to publish (nudity, weapons, ID or bank cards…).</li>}
        <li>Only then are steps written, always in <b>your own words</b>, and you review everything before publishing.</li>
      </ol>
      {source === 'voice' && <p className="muted">Your recording itself is never stored. If it doesn’t pass, nothing is kept at all.</p>}
    </details>
  )
}

export type ReviewMeta = { title: string; category: Category; missing: string[] }

export function ReviewMetaEditor({ meta, onChange }: { meta: ReviewMeta; onChange: (m: ReviewMeta) => void }) {
  return (
    <div className="review-meta">
      <label className="fl">Title<input className="txt" value={meta.title} maxLength={120} onChange={e => onChange({ ...meta, title: e.target.value })} /></label>
      <label className="fl">Category
        <select className="txt" value={meta.category} onChange={e => onChange({ ...meta, category: e.target.value as Category })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
      </label>
      {meta.missing.length > 0 && <p className="note warn-note span2"><Icon name="alert" /><span>The AI thinks you may have skipped: {meta.missing.join('; ')}. Add it to an instruction below, or record again.</span></p>}
    </div>
  )
}
