import { useEffect, useState } from 'react'
import { OutlineOverlay } from '../components/OutlineOverlay'
import { CATEGORIES, fetchGuides } from '../lib/data'
import type { Guide, Outline } from '../lib/types'

type Example = { guide: Guide; idx: number; src: string; ai: boolean; outline: Outline | null }

// The intro shows a real published step: a video frame with the outline SAM returned, else a voice guide's AI illustration.
function pickExample(guides: Guide[]): Example | null {
  for (const guide of guides) {
    const s = guide.steps.find(s => s.keyframeUrl && s.outline)
    if (s?.keyframeUrl) return { guide, idx: s.idx, src: s.keyframeUrl, ai: false, outline: s.outline }
  }
  for (const guide of guides.filter(g => g.kind === 'voice')) {
    const s = guide.steps.find(s => s.imageUrl)
    if (s?.imageUrl) return { guide, idx: s.idx, src: s.imageUrl.replace(/-ai\.jpg$/, '-ai-focus.jpg'), ai: true, outline: null }
  }
  return null
}

export function GalleryView() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [all, setAll] = useState<Guide[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { fetchGuides().then(setAll, e => setError((e as Error).message)) }, [])
  const needle = q.trim().toLowerCase()
  const guides = (all ?? []).filter(g =>
    (cat === 'All' || g.category === cat) && (!needle || `${g.title} ${g.creatorName} ${g.category}`.toLowerCase().includes(needle)))
  const ex = pickExample(all ?? [])

  return (
    <>
      <section className={ex ? 'intro' : 'intro solo'}>
        <div>
          <h1>Follow along.<br />Get unstuck.</h1>
          <p>Step-by-step guides from real people’s know-how, filmed or spoken. Stuck on a step of a video guide? Show it a photo and it points at what’s different.</p>
          <a className="btn btn-ink" href="#/create">Create a guide</a>
        </div>
        {ex && (
          <a className="example-link" href={`#/guide/${ex.guide.id}/${ex.idx + 1}`}>
            <div className={ex.ai ? 'example ai' : 'example'}>
              <img src={ex.src} alt={`Example: step ${ex.idx + 1} of “${ex.guide.title}”, key part ${ex.ai ? 'circled' : 'outlined'}`} />
              {ex.outline && <OutlineOverlay outline={ex.outline} label={ex.guide.steps[ex.idx]?.keyPart ?? ''} />}
              <span className={ex.ai ? 'mono tag tag-ai' : 'mono tag'}>{ex.ai ? 'Illustration by AI' : `${ex.guide.creatorName}’s video · step ${ex.idx + 1}`}</span>
            </div>
            <span className="meta">Example: “{ex.guide.title}”, step {ex.idx + 1}</span>
          </a>
        )}
      </section>
      <ol className="howline" aria-label="How it works">
        <li><b className="mono">1</b> Watch one step at a time</li>
        <li><b className="mono">2</b> Stuck? Snap a photo</li>
        <li><b className="mono">3</b> See what’s different, outlined on your photo</li>
      </ol>

      <div className="filters">
        <input className="search" type="search" aria-label="Search guides" value={q} onChange={e => setQ(e.target.value)} placeholder="Search guides: bookcase, printer…" />
        <div className="cats" role="group" aria-label="Category">
          {['All', ...CATEGORIES].map(c => <button key={c} className="tab" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>

      {error ? <p className="note warn-note">{error}</p> : !all ? <p className="working"><span className="spin" aria-hidden="true" /> Loading guides…</p> : guides.length ? (
        <div className="grid">
          {guides.map(g => {
            const s = g.steps[0]
            const aiImg = !s?.keyframeUrl && !!s?.imageUrl
            return (
              <a key={g.id} className="gcard" href={`#/guide/${g.id}/1`}>
                <div className={aiImg ? 'img ai' : 'img'}>
                  {s?.keyframeUrl ? <img src={s.keyframeUrl} alt="" loading="lazy" />
                    : s?.imageUrl ? <img src={s.imageUrl} alt="" loading="lazy" />
                    : g.videoUrl ? <video src={`${g.videoUrl}#t=${s?.startS ?? 0}`} muted playsInline preload="metadata" /> : <span className="ph">No picture yet</span>}
                  {g.fixture && <span className="mono tag tag-fixture">TEST FIXTURE</span>}
                  {!g.fixture && aiImg && <span className="mono tag tag-ai">Illustration by AI</span>}
                </div>
                <h3>{g.title}</h3>
                <span className="meta">{g.creatorName} · {g.category} · {g.steps.length} steps</span>
              </a>
            )
          })}
        </div>
      ) : <p className="empty">{all.length ? `No guides match “${q}”.` : 'No guides yet. '}{!all.length && <a href="#/create">Create the first one</a>}</p>}
    </>
  )
}
