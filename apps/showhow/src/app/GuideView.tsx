import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChatPanel } from '../components/ChatPanel'
import { Icon } from '../components/Icon'
import { OutlineOverlay } from '../components/OutlineOverlay'
import { StuckDialog } from '../components/StuckDialog'
import { checkStep } from '../lib/data'
import type { Guide, Outline, Step } from '../lib/types'
import './guide.css'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const focusUrl = (url: string) => url.replace(/-ai\.jpg($|\?)/, '-ai-focus.jpg$1')

export function GuideView({ guide, stepIdx }: { guide: Guide; stepIdx: number }) {
  const [done, setDone] = useState<Set<number>>(() => new Set())
  const [showPart, setShowPart] = useState(true)
  const [stepsOpen, setStepsOpen] = useState(false) // phone only: the step list is behind "All steps"
  const [dialog, setDialog] = useState<'stuck' | 'where' | null>(null)
  const [helpOpen, setHelpOpen] = useState(false) // phone/tablet: help + chat open as a full-screen sheet
  const n = guide.steps.length
  const step = guide.steps[stepIdx]
  const first = stepIdx === 0
  const last = stepIdx === n - 1
  // A check needs a real reference frame; AI images never qualify.
  const canCheck = guide.kind === 'video' && (!!step.keyframeUrl || guide.fixture)

  const go = (idx: number) => { if (idx >= 0 && idx < n) location.hash = `#/guide/${guide.id}/${idx + 1}` }
  const next = () => { setDone(d => new Set(d).add(stepIdx)); go(stepIdx + 1) }

  // Announce step changes to screen readers: focus the step title (skipped on first load).
  const titleRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  useEffect(() => { if (firstRender.current) firstRender.current = false; else titleRef.current?.focus({ preventScroll: true }) }, [stepIdx])

  useEffect(() => {
    if (!helpOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setHelpOpen(false) }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [helpOpen])

  // F12: ←/→ change step, except while typing or with the photo dialog open.
  useEffect(() => {
    if (dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
      if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowLeft') go(stepIdx - 1)
      if (e.key === 'ArrowRight') go(stepIdx + 1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const arrows = (
    <div className="gv-arrows">
      <button onClick={() => go(stepIdx - 1)} disabled={first} aria-label="Previous step">‹</button>
      <button onClick={() => go(stepIdx + 1)} disabled={last} aria-label="Next step">›</button>
    </div>
  )
  const backNext = (
    <>
      <button className="btn btn-line" onClick={() => go(stepIdx - 1)} disabled={first}>Back</button>
      <button className="btn btn-ink" onClick={next}>{last ? 'Finish' : 'Next step'}</button>
    </>
  )

  return (
    <div className="gv">
      <div className="gv-crumbs">
        <a href="#/" className="muted">← All guides</a>
        <span className="mono muted">{guide.kind === 'voice' ? `Talked through by ${guide.creatorName} · illustrated by AI` : `Made from ${guide.creatorName}’s video`} · {n} steps</span>
        {guide.fixture && <span className="mono gv-tag gv-tag-fixture">TEST FIXTURE</span>}
      </div>
      <h1 className="gv-title">{guide.title}</h1>

      <div className="gv-phead">
        <span className="mono">Step {stepIdx + 1} / {n}</span>
        <button className="btn btn-line gv-small" aria-expanded={stepsOpen} aria-controls="gv-steps" onClick={() => setStepsOpen(o => !o)}>All steps</button>
        <div className="gv-segs" aria-hidden="true">{guide.steps.map(s => <i key={s.idx} className={s.idx <= stepIdx ? 'on' : ''} />)}</div>
      </div>

      <div className="gv-bench">
        <nav id="gv-steps" className={`gv-steps ${stepsOpen ? 'open' : ''}`} aria-label="Steps">
          <div className="gv-prog"><span className="mono">Step {stepIdx + 1} / {n}</span><span className="mono muted" title="Use the arrow keys to change step">←/→</span></div>
          <div className="gv-track" role="progressbar" aria-label={`${done.size} of ${n} done`} aria-valuemin={0} aria-valuemax={n} aria-valuenow={done.size}><i style={{ width: `${(done.size / n) * 100}%` }} /></div>
          {guide.steps.map(s => (
            <button key={s.idx} className={`gv-srow ${done.has(s.idx) ? 'done' : ''}`} aria-current={s.idx === stepIdx ? 'step' : undefined} onClick={() => { setStepsOpen(false); go(s.idx) }}>
              <span className="n">{done.has(s.idx) ? '✓' : s.idx + 1}</span>
              <span className="t">{s.title}{guide.kind === 'video' && <small className="mono">{mmss(s.startS)}–{mmss(s.endS)}</small>}</span>
            </button>
          ))}
        </nav>

        <div className="gv-center">
          {guide.kind === 'voice'
            ? <AiImage url={step.imageUrl} label="Illustration by AI" outline={step.outline} keyPart={step.keyPart} showPart={showPart} onTogglePart={() => setShowPart(v => !v)} arrows={arrows} />
            : <VideoOrEnhanced guide={guide} step={step} showPart={showPart} onTogglePart={() => setShowPart(v => !v)} arrows={arrows} />}
          {guide.kind === 'video' && <div className="gv-timeline" aria-label="Full video">
            <span className="mono muted">Video</span>
            {guide.steps.map(s => (
              <button key={s.idx} className="gv-seg" style={{ flex: Math.max(s.endS - s.startS, 1) }} aria-label={`Step ${s.idx + 1}, ${mmss(s.startS)}`}
                aria-current={s.idx === stepIdx ? 'true' : undefined} onClick={() => go(s.idx)}><span /></button>
            ))}
          </div>}
          <div className="gv-stepnav">
            <span className="gv-bignum" aria-hidden="true">{stepIdx + 1}</span>
            <div>
              <h2 id="st-title" ref={titleRef} tabIndex={-1}><span className="sr">Step {stepIdx + 1} of {n}: </span>{step.title}</h2>
              <p className="gv-lead">{step.instruction}</p>
              <div className="gv-keypart"><i aria-hidden="true" /><span>Key part: <b>{step.keyPart}</b></span></div>
            </div>
            <div className="gv-pn">{backNext}</div>
          </div>
          {(step.audioUrl || step.tipQuote || canCheck) && <div className="gv-extras">
            {step.audioUrl && <ReadAloud key={step.audioUrl} url={step.audioUrl} />}
            {step.tipQuote && <p className="gv-quote">“{step.tipQuote}”<span className="mono">Creator’s tip · {guide.kind === 'video' ? `${guide.creatorName}, in the video` : 'in their words'}</span></p>}
            {canCheck && <div className="gv-stuck">
              <h3>Stuck on this step?</h3>
              <p>Snap your work. It’s compared with {guide.creatorName}’s real frame for step {stepIdx + 1}.</p>
              <button className="btn btn-signal" onClick={() => setDialog('stuck')}><Icon name="camera" /> I’m stuck</button>
            </div>}
          </div>}
        </div>

        <aside className={`gv-help ${helpOpen ? 'open' : ''}`} aria-label="Chat about this guide">
          <div className="gv-sheet-head"><b>Chat · step {stepIdx + 1}</b><button className="icon-btn" onClick={() => setHelpOpen(false)} aria-label="Close chat"><Icon name="x" /></button></div>
          <ChatPanel key={guide.id} guideId={guide.id} guideTitle={guide.title} stepIdx={stepIdx} />
        </aside>
      </div>

      <div className="gv-pbar">
        <button className="btn btn-line" onClick={() => setHelpOpen(true)}>
          Chat about this step
        </button>
        <div className="row">{backNext}</div>
      </div>

      {dialog && <StuckDialog guide={guide} stepIdx={stepIdx} mode={dialog} check={checkStep} onClose={() => setDialog(null)} onGoToStep={go} />}
    </div>
  )
}

type MediaProps = { showPart: boolean; onTogglePart: () => void; arrows: ReactNode }

// F11: the picture keeps its own shape; the box shrink-wraps it, so outlines line up exactly.
// Voice illustrations pass `outline` (SAM's box on the picture, or null). Enhanced video stills have none
// and keep their older AI-drawn circle image (-ai-focus.jpg).
function AiImage({ url, label, outline, keyPart = '', showPart, onTogglePart, arrows, extra }: MediaProps & { url?: string; label: string; outline?: Outline | null; keyPart?: string; extra?: ReactNode }) {
  const sam = outline !== undefined
  return (
    <div className="gv-media ai">
      {url ? <img src={showPart && !sam ? focusUrl(url) : url} alt="" /> : <div className="gv-ph">No illustration for this step</div>}
      {url && showPart && outline && <OutlineOverlay outline={outline} label={keyPart} />}
      <span className="mono gv-tag gv-tag-ai">{label}</span>
      {arrows}
      <div className="gv-ctrls">
        {url && (sam
          ? <button className={`gv-sq ${showPart && outline ? 'on' : ''}`} onClick={onTogglePart} aria-pressed={showPart} disabled={!outline}>{outline ? 'Show part' : 'No outline for this step'}</button>
          : <button className={`gv-sq ${showPart ? 'on' : ''}`} onClick={onTogglePart} aria-pressed={showPart}>AI circle</button>)}
        {extra}
      </div>
    </div>
  )
}

// Video guides: the real clip by default; an "Enhanced by AI" still if the creator kept one (T18).
function VideoOrEnhanced(props: MediaProps & { guide: Guide; step: Step }) {
  const [enhanced, setEnhanced] = useState(false)
  const { step } = props
  const toggle = step.imageUrl && <button className={`gv-sq ${enhanced ? 'on' : ''}`} aria-pressed={enhanced} onClick={() => setEnhanced(e => !e)}>Enhanced by AI</button>
  return enhanced && step.imageUrl
    ? <AiImage url={step.imageUrl} label="Enhanced by AI · not the original frame" showPart={props.showPart} onTogglePart={props.onTogglePart} arrows={props.arrows} extra={toggle} />
    : <StepPlayer {...props} extra={toggle} />
}

function ReadAloud({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="gv-audio">
      <audio ref={ref} src={url} preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button className="btn btn-line" onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}><Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Pause' : 'Read aloud'}</button>
      {playing && <button className="btn btn-line" onClick={() => { const a = ref.current; if (a) { a.pause(); a.currentTime = 0 } }}>Stop</button>}
    </div>
  )
}

// Plays only [startS, endS) of the guide's single video, on a loop.
function StepPlayer({ guide, step, showPart, onTogglePart, arrows, extra }: MediaProps & { guide: Guide; step: Step; extra?: ReactNode }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false) // clips start paused; the learner presses play (2026-11-03)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const seek = () => { v.currentTime = step.startS }
    const loop = () => { if (v.currentTime >= step.endS || v.currentTime < step.startS - 0.5) seek() }
    if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true })
    v.addEventListener('timeupdate', loop)
    return () => v.removeEventListener('timeupdate', loop)
  }, [step])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (playing) v.play()?.catch(() => setPlaying(false)); else v.pause()
  }, [playing, step])

  return (
    <div className="gv-media video">
      {guide.videoUrl
        ? <video ref={ref} src={guide.videoUrl} muted playsInline aria-label={`Step ${step.idx + 1} clip`} />
        : <div className="gv-ph">TEST FIXTURE · no video for this guide yet</div>}
      {showPart && step.outline && <OutlineOverlay outline={step.outline} label={step.keyPart} />}
      <span className="mono gv-tag">{mmss(step.startS)}–{mmss(step.endS)} · {guide.creatorName}’s video</span>
      {arrows}
      <div className="gv-ctrls">
        {guide.videoUrl && <button className="gv-sq" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause clip' : 'Play clip'}><Icon name={playing ? 'pause' : 'play'} /></button>}
        <button className={`gv-sq ${showPart && step.outline ? 'on' : ''}`} onClick={onTogglePart} aria-pressed={showPart} disabled={!step.outline}>
          {step.outline ? 'Show part' : 'No outline for this step'}
        </button>
        {extra}
      </div>
    </div>
  )
}
