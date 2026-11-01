import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { OutlineOverlay } from '../components/OutlineOverlay'
import { StuckDialog } from '../components/StuckDialog'
import { checkStep } from '../lib/data'
import type { Guide, Step } from '../lib/types'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const go = (g: Guide, idx: number) => { location.hash = `#/guide/${g.id}/${idx + 1}` }
const focusUrl = (url: string) => url.replace(/-ai\.jpg($|\?)/, '-ai-focus.jpg$1')

export function GuideView({ guide, stepIdx }: { guide: Guide; stepIdx: number }) {
  const [done, setDone] = useState<Set<number>>(() => new Set())
  const [showPart, setShowPart] = useState(true)
  const [dialog, setDialog] = useState<'stuck' | 'where' | null>(null)
  const step = guide.steps[stepIdx]
  const last = stepIdx === guide.steps.length - 1
  // A check needs a real reference frame; AI images never qualify.
  const canCheck = guide.kind === 'video' && (!!step.keyframeUrl || guide.fixture)

  // On phones the step list is a horizontal strip; keep the current step in view.
  useEffect(() => {
    document.querySelector('.step-btn[aria-current="step"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [stepIdx])

  return (
    <>
      <a className="back" href="#/"><Icon name="back" /> All guides</a>
      <div className="g-head">
        <p className="meta">Made from {guide.creatorName}’s video<span className="dot" />{guide.steps.length} steps
          {guide.fixture && <span className="fixture-tag">TEST FIXTURE</span>}</p>
        <h1>{guide.title}</h1>
      </div>

      <div className="g-layout">
        <nav className="steps" aria-label="Steps">
          <div className="prog"><b>{done.size} of {guide.steps.length} done</b><div className="bar"><i style={{ width: `${(done.size / guide.steps.length) * 100}%` }} /></div></div>
          {guide.steps.map(s => (
            <button key={s.idx} className={`step-btn ${done.has(s.idx) ? 'done' : ''}`} aria-current={s.idx === stepIdx ? 'step' : undefined} onClick={() => go(guide, s.idx)}>
              <span className="num">{done.has(s.idx) ? <Icon name="check" /> : s.idx + 1}</span>
              <span>{s.title}<small>{mmss(s.startS)}–{mmss(s.endS)}</small></span>
            </button>
          ))}
        </nav>

        <section aria-labelledby="st-title">
          <div className="player">
            {guide.kind === 'voice'
              ? <AiImage url={step.imageUrl} label="Illustration by AI" showPart={showPart} onTogglePart={() => setShowPart(v => !v)} />
              : <VideoOrEnhanced guide={guide} step={step} showPart={showPart} onTogglePart={() => setShowPart(v => !v)} />}
            {guide.kind === 'video' && <div className="timeline" aria-label="Full video">
              <span className="lbl"><Icon name="film" /> Full video</span>
              {guide.steps.map(s => (
                <button key={s.idx} className="seg" style={{ flex: s.endS - s.startS }} aria-label={`Step ${s.idx + 1}, ${mmss(s.startS)}`}
                  aria-current={s.idx === stepIdx ? 'true' : undefined} onClick={() => go(guide, s.idx)}>{s.idx + 1}</button>
              ))}
            </div>}
            <div className="instr">
              <span className="k">Step {stepIdx + 1} of {guide.steps.length}</span>
              <h2 id="st-title">{step.title}</h2>
              <p>{step.instruction}</p>
              <span className="part"><i />{step.keyPart}</span>
              {step.audioUrl && <ReadAloud key={step.audioUrl} url={step.audioUrl} />}
              {step.tipQuote && (
                <div className="tip"><span className="mic"><Icon name="mic" /></span>
                  <div><q>{step.tipQuote}</q><small>{guide.creatorName}, in the video · transcribed</small></div></div>
              )}
              <div className="actions">
                {stepIdx > 0 && <button className="btn btn-ghost" onClick={() => go(guide, stepIdx - 1)}><Icon name="left" /> Back</button>}
                <span className="sp" />
                <button className="btn btn-primary" onClick={() => { setDone(d => new Set(d).add(stepIdx)); if (!last) go(guide, stepIdx + 1) }}>
                  {last ? 'Finish' : 'Done, next step'} <Icon name="right" />
                </button>
              </div>
            </div>
          </div>

          {canCheck && <div className="stuck-cta">
            <div><b>Stuck on this step?</b><span>Snap your work. It’s compared with {guide.creatorName}’s step {stepIdx + 1}.</span></div>
            <div className="btns">
              <button className="btn btn-signal" onClick={() => setDialog('stuck')}><Icon name="camera" /> I’m stuck</button>
            </div>
          </div>}
        </section>
      </div>

      {dialog && <StuckDialog guide={guide} stepIdx={stepIdx} mode={dialog} check={checkStep} onClose={() => setDialog(null)} onGoToStep={i => go(guide, i)} />}
    </>
  )
}

function AiImage({ url, label, showPart, onTogglePart }: { url?: string; label: string; showPart: boolean; onTogglePart: () => void }) {
  return (
    <div className="stage">
      {url ? <img className="stage-img" src={showPart ? focusUrl(url) : url} alt="" /> : <div className="ph stage-ph">No illustration for this step</div>}
      <span className="pill stage-label">{label}</span>
      {url && <div className="stage-ui"><button className={`pill ${showPart ? 'on' : ''}`} onClick={onTogglePart} aria-pressed={showPart}><Icon name="frame" /> Show part</button></div>}
    </div>
  )
}

// Video guides: the real clip by default; an "Enhanced by AI" still if the creator kept one (T18).
function VideoOrEnhanced(props: { guide: Guide; step: Step; showPart: boolean; onTogglePart: () => void }) {
  const [enhanced, setEnhanced] = useState(false)
  const { step } = props
  return (
    <>
      {enhanced && step.imageUrl
        ? <AiImage url={step.imageUrl} label="Enhanced by AI · not the original frame" showPart={props.showPart} onTogglePart={props.onTogglePart} />
        : <StepPlayer {...props} />}
      {step.imageUrl && (
        <div className="view-switch" role="group" aria-label="View">
          <button className="chip" aria-pressed={!enhanced} onClick={() => setEnhanced(false)}>Original video</button>
          <button className="chip" aria-pressed={enhanced} onClick={() => setEnhanced(true)}>Enhanced by AI</button>
        </div>
      )}
    </>
  )
}

function ReadAloud({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="read-aloud">
      <audio ref={ref} src={url} preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button className="btn btn-ghost" onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}><Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Pause' : 'Read aloud'}</button>
      {playing && <button className="btn btn-ghost" onClick={() => { const a = ref.current; if (a) { a.pause(); a.currentTime = 0 } }}>Stop</button>}
    </div>
  )
}

// Plays only [startS, endS) of the guide's single video, on a loop.
function StepPlayer({ guide, step, showPart, onTogglePart }: { guide: Guide; step: Step; showPart: boolean; onTogglePart: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)

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
    if (playing) v.play().catch(() => setPlaying(false)); else v.pause()
  }, [playing, step])

  return (
    <div className="stage">
      {guide.videoUrl
        ? <video ref={ref} src={guide.videoUrl} muted playsInline aria-label={`Step ${step.idx + 1} clip`} />
        : <div className="ph stage-ph">TEST FIXTURE · no video for this guide yet</div>}
      {showPart && step.outline && <OutlineOverlay outline={step.outline} label={step.keyPart} />}
      <span className="pill stage-label"><Icon name="film" /> {mmss(step.startS)}–{mmss(step.endS)} of {guide.creatorName}’s video</span>
      <div className="stage-ui">
        {guide.videoUrl && <button className="pill round" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause clip' : 'Play clip'}><Icon name={playing ? 'pause' : 'play'} /></button>}
        <button className={`pill ${showPart && step.outline ? 'on' : ''}`} onClick={onTogglePart} aria-pressed={showPart} disabled={!step.outline}>
          <Icon name="frame" /> {step.outline ? 'Show part' : 'No outline for this step'}
        </button>
      </div>
    </div>
  )
}
