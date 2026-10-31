import { useState } from 'react'
import { Icon } from '../components/Icon'
import { CATEGORIES, listGuides } from '../lib/data'

const initials = (name: string) => name.split(' ').map(w => w[0]).join('')

export function GalleryView() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const guides = listGuides().filter(g =>
    (cat === 'All' || g.category === cat) && (!needle || `${g.title} ${g.creatorName} ${g.category}`.toLowerCase().includes(needle)))

  return (
    <>
      <section className="hero">
        <div>
          <h1>Follow along.<br /><em>Get unstuck.</em></h1>
          <p>Step-by-step guides made from real people’s videos. Stuck on a step? Show it one photo. It checks your work against the creator’s and points at what’s off.</p>
        </div>
        <ol className="how" aria-label="How it works">
          <li><span className="n">1</span><div><b>Watch one step at a time</b><span>Each step is a short part of the creator’s video</span></div></li>
          <li><span className="n">2</span><div><b>Stuck? Snap a photo</b><span>Only when you need it, only the step you’re on</span></div></li>
          <li><span className="n">3</span><div><b>See what’s different</b><span>The part is outlined on your own photo</span></div></li>
        </ol>
      </section>

      <div className="filters">
        <label className="search"><Icon name="search" /><span className="sr">Search guides</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search guides: bookcase, printer…" />
        </label>
        <div className="chips" role="group" aria-label="Category">
          {['All', ...CATEGORIES].map(c => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>

      {guides.length ? (
        <div className="grid">
          {guides.map(g => (
            <a key={g.id} className="card" href={`#/guide/${g.id}/1`}>
              <div className="thumb">
                {g.videoUrl ? <video src={`${g.videoUrl}#t=${g.steps[0]?.startS ?? 0}`} muted playsInline preload="metadata" /> : <span className="ph">{g.title}</span>}
                <span className="badge"><Icon name="steps" /> {g.steps.length} steps</span>
                {g.fixture && <span className="fixture-tag on-thumb">TEST FIXTURE</span>}
              </div>
              <div className="card-b">
                <h3>{g.title}</h3>
                <div className="meta"><span className="av" aria-hidden="true">{initials(g.creatorName)}</span>{g.creatorName}<span className="dot" />{g.category}</div>
              </div>
            </a>
          ))}
        </div>
      ) : <p className="empty">No guides match “{q}”.</p>}
    </>
  )
}
