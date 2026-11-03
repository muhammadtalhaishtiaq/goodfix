import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { StageTicks } from '../components/StageTicks'
import { api, apiStream } from '../lib/api'
import { GuideFields, HowWeCheck, ReviewMetaEditor, WhoKeepsWhat, type CategoryChoice, type Duplicate, type ReviewMeta } from '../components/CreateFields'
import type { Category } from '../lib/categories'
import type { DraftStep } from '../lib/steps'
import { STYLE_IDS, STYLES, type StyleId } from '../lib/styles'
import { mediaUrl } from '../lib/supabase'
import { Published } from './CreateView'

type ImgState = 'waiting' | 'drawing' | 'ok' | 'failed'
type ReviewStep = DraftStep & { img: ImgState; keep: boolean; v: number }
type Phase =
  | { name: 'form' }
  | { name: 'checking'; stages: string[] }
  | { name: 'blocked'; message: string; stages: string[] }
  | { name: 'review'; guideId: string; steps: ReviewStep[]; meta: ReviewMeta; base: 'drawing' | 'ok' | 'failed' }
  | { name: 'publishing' }
  | { name: 'published'; path: string; title: string }
  | { name: 'error'; message: string; retry?: () => void }

const CODE_KEY = 'showhow.accessCode'
const readCode = () => { try { return sessionStorage.getItem(CODE_KEY) ?? '' } catch { return '' } }
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

export function VoiceCreate() {
  const [phase, setPhase] = useState<Phase>({ name: 'form' })
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryChoice>('auto')
  const [creatorName, setCreatorName] = useState('')
  const [code, setCode] = useState(readCode)
  const [style, setStyle] = useState<StyleId>('flat')
  const [audio, setAudio] = useState<Blob | null>(null)
  const [consent, setConsent] = useState(false)
  const [adult, setAdult] = useState(false)
  const key = () => code.trim()
  const ready = audio && creatorName.trim() && key() && consent && adult

  async function start() {
    if (!audio) return
    try { sessionStorage.setItem(CODE_KEY, key()) } catch { /* private mode: fine */ }
    setPhase({ name: 'checking', stages: [] })
    try {
      const { toWav16k } = await import('../lib/shrink')
      const { wav } = await toWav16k(audio)
      const out = await apiStream<{ id: string; steps: DraftStep[]; missing: string[]; title: string; category: Category; duplicate: Duplicate | null }>(
        'voice-guides', { file: wav, meta: { title: title.trim(), category, creatorName: creatorName.trim(), style, consent, adult } }, key(),
        e => setPhase(p => (p.name === 'checking' ? { ...p, stages: [...p.stages, e.stage] } : p)),
      )
      // Steps exist now: show them straight away and draw the pictures in the background (F9).
      setPhase({ name: 'review', guideId: out.id, base: 'drawing', meta: { title: out.title, category: out.category, missing: out.missing, duplicate: out.duplicate }, steps: out.steps.map(s => ({ ...s, img: 'waiting', keep: true, v: 0 })) })
      void drawAll(out.id, out.steps.map(s => s.idx))
    } catch (e) {
      const m = message(e)
      setPhase(p => (m.includes('Nothing was saved') ? { name: 'blocked', message: m, stages: p.name === 'checking' ? p.stages : [] } : { name: 'error', message: m }))
    }
  }

  const setStep = (idx: number, patch: Partial<ReviewStep>) =>
    setPhase(p => (p.name === 'review' ? { ...p, steps: p.steps.map(s => (s.idx === idx ? { ...s, ...patch } : s)) } : p))

  // Base picture once, then every step in parallel; each card fills in as its image arrives.
  async function drawAll(guideId: string, idxs: number[]) {
    setPhase(p => (p.name === 'review' ? { ...p, base: 'drawing', steps: p.steps.map(s => ({ ...s, img: 'waiting' })) } : p))
    try {
      await api('voice-images', { guideId }, key())
    } catch {
      setPhase(p => (p.name === 'review' ? { ...p, base: 'failed', steps: p.steps.map(s => ({ ...s, img: 'failed', keep: false })) } : p))
      return
    }
    setPhase(p => (p.name === 'review' ? { ...p, base: 'ok' } : p))
    await Promise.all(idxs.map(async idx => {
      setStep(idx, { img: 'drawing' })
      try {
        const r = await api<{ ok: boolean }>('voice-images', { guideId, idx }, key())
        setStep(idx, { img: r.ok ? 'ok' : 'failed', keep: r.ok, v: Date.now() })
      } catch {
        setStep(idx, { img: 'failed', keep: false })
      }
    }))
  }

  async function publish(p: Extract<Phase, { name: 'review' }>) {
    setPhase({ name: 'publishing' })
    try {
      const out = await api<{ path: string }>('publish', { guideId: p.guideId, title: p.meta.title.trim(), category: p.meta.category, edits: p.steps.map(s => ({ idx: s.idx, title: s.title, instruction: s.instruction, dropAiImage: s.img === 'ok' && !s.keep })) }, key())
      setPhase({ name: 'published', path: out.path, title: p.meta.title.trim() })
    } catch (e) {
      setPhase({ name: 'error', message: message(e), retry: () => publish(p) })
    }
  }

  return (
    <div className="narrow">
      <h1>Talk it through</h1>
      <p className="sub">No video? Explain the fix out loud, step by step. Showhow checks it’s a clear how-to and not a blocked topic, writes the steps in your words, and illustrates each one.</p>
      <CreateTabs active="voice" />

      {phase.name === 'form' && (
        <div className="cform">
          <Recorder onAudio={setAudio} />

          <fieldset className="styles">
            <legend><b>Illustration style</b> <span className="hint">Every image is labelled “Illustration by AI”</span></legend>
            <div className="style-grid">
              {STYLE_IDS.map(id => (
                <label key={id} className={`style-opt ${style === id ? 'on' : ''}`}>
                  <input type="radio" name="style" checked={style === id} onChange={() => setStyle(id)} />
                  <img src={`/styles/${id}.jpg`} alt="" loading="lazy" />
                  <span>{STYLES[id].label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <GuideFields title={title} setTitle={setTitle} category={category} setCategory={setCategory} creatorName={creatorName} setCreatorName={setCreatorName} code={code} setCode={setCode} source="voice" />

          <HowWeCheck source="voice" />
          <WhoKeepsWhat rows={[
            { who: 'Showhow', what: <>Checks the recording in memory. <b>Nothing is stored unless it passes</b> both checks; the recording itself is never stored.</>, keeps: 'Checks' },
            { who: 'Meta Voice Transcribe, Muse Spark, Muse Image', what: 'Turn your words into checked steps and illustrations. Sent with Meta’s response storage turned off; Meta’s terms apply.', keeps: 'Processes' },
            { who: 'Once you publish', what: 'The steps and illustrations are public.', keeps: 'Public' },
          ]} />
          <div className="consent">
            <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree to this.</label>
            <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I’m 18 or older.</label>
          </div>
          <p className="note"><span><b>Nothing is sent until you press Check and build.</b> Then, in order: your words are transcribed, checked against our topic rules, and reviewed by Meta Muse Spark. If any check fails, we stop, show you why, and save nothing.</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" disabled={!ready} onClick={start}>Check and build</button></div>
        </div>
      )}

      {phase.name === 'checking' && (
        <div className="panel">
          <h2>Checking your recording</h2>
          <p className="muted">Usually 30 to 90 seconds. Keep this tab open. Nothing is saved unless every check passes.</p>
          <StageTicks done={phase.stages} />
        </div>
      )}

      {phase.name === 'blocked' && (
        <div className="panel">
          <h2>We stopped at this check</h2>
          <StageTicks done={phase.stages} failed />
          <p className="note warn-note" role="alert">{phase.message}</p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" onClick={() => { setAudio(null); setPhase({ name: 'form' }) }}>Record again</button></div>
        </div>
      )}

      {phase.name === 'review' && (
        <div className="panel wide">
          <h2>Review your steps</h2>
          <p className="note">Passed our topic check and reads as a clear how-to. AI can be wrong: review each step while the pictures are drawn, then publish.</p>
          <ReviewMetaEditor meta={phase.meta} onChange={meta => setPhase(p => (p.name === 'review' ? { ...p, meta } : p))} />
          <p className="mono muted" aria-live="polite">
            {phase.base === 'drawing' ? `Drawing the base picture in “${STYLES[style].label}”…`
              : phase.base === 'failed' ? 'The illustrations couldn’t be drawn right now. You can publish text-only steps or redraw.'
              : `${phase.steps.filter(s => s.img === 'ok').length} of ${phase.steps.length} illustrations ready`}
          </p>
          <ol className="rgrid">
            {phase.steps.map(s => (
              <li key={s.idx} className="rc">
                <div className="rimg ai">
                  {s.img === 'ok' && s.keep
                    ? <img src={`${mediaUrl(`${phase.guideId}/${s.idx}-ai-focus.jpg`)}?v=${s.v}`} alt={`Illustration of step ${s.idx + 1}`} />
                    : s.img === 'waiting' || s.img === 'drawing'
                      ? <span className="shim">{s.img === 'drawing' ? 'Drawing…' : 'Waiting for the base picture…'}</span>
                      : <span className="ph">No illustration</span>}
                  <span className="mono tag tag-ai">{s.idx + 1} · Illustration by AI</span>
                </div>
                <label><span className="sr">Step {s.idx + 1} title</span><input className="txt" value={s.title} maxLength={60} onChange={e => setStep(s.idx, { title: e.target.value })} /></label>
                <label><span className="sr">Step {s.idx + 1} instruction</span><textarea value={s.instruction} maxLength={300} onChange={e => setStep(s.idx, { instruction: e.target.value })} /></label>
                {s.img === 'ok' && <label className="check"><input type="checkbox" checked={s.keep} onChange={e => setStep(s.idx, { keep: e.target.checked })} /> Keep this illustration</label>}
              </li>
            ))}
          </ol>
          <div className="actions">
            <button className="btn btn-line" disabled={phase.base === 'drawing' || phase.steps.some(s => s.img === 'drawing')} onClick={() => drawAll(phase.guideId, phase.steps.map(s => s.idx))}>Redraw all illustrations</button>
            <span className="sp" />
            <button className="btn btn-ink" disabled={!phase.meta.title.trim() || phase.steps.some(s => !s.title.trim() || !s.instruction.trim())} onClick={() => publish(phase)}>Publish guide</button>
          </div>
        </div>
      )}

      {phase.name === 'publishing' && <div className="panel"><p className="working"><span className="spin" aria-hidden="true" /> Publishing…</p></div>}
      {phase.name === 'published' && <Published path={phase.path} title={phase.title} />}
      {phase.name === 'error' && (
        <div className="panel">
          <p className="note warn-note">{phase.message}</p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" onClick={phase.retry ?? (() => setPhase({ name: 'form' }))}>Try again</button></div>
        </div>
      )}
    </div>
  )
}

export function CreateTabs({ active }: { active: 'video' | 'voice' }) {
  return (
    <div className="tabs create-tabs" role="tablist" aria-label="How do you want to share it?">
      <a className="tab" role="tab" aria-selected={active === 'video'} href="#/create">Film it</a>
      <a className="tab" role="tab" aria-selected={active === 'voice'} href="#/create/voice">Talk it through</a>
    </div>
  )
}

// Record up to 2 minutes in the browser, or pick an audio file.
function Recorder({ onAudio }: { onAudio: (b: Blob | null) => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<number>(0)

  useEffect(() => () => { clearInterval(timer.current); rec.current?.stream.getTracks().forEach(t => t.stop()) }, [])

  function take(b: Blob) { setUrl(u => { if (u) URL.revokeObjectURL(u); return URL.createObjectURL(b) }); setState('done'); onAudio(b) }

  async function startRec() {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = e => chunks.push(e.data)
      r.onstop = () => { stream.getTracks().forEach(t => t.stop()); clearInterval(timer.current); take(new Blob(chunks, { type: r.mimeType })) }
      rec.current = r
      r.start()
      setSeconds(0)
      setState('recording')
      onAudio(null)
      timer.current = window.setInterval(() => setSeconds(s => { if (s + 1 >= 120) r.stop(); return s + 1 }), 1000)
    } catch {
      setErr('Microphone access was blocked. Allow it in the browser, or upload an audio file instead.')
    }
  }

  return (
    <div className="drop recorder">
      <b className="big">Record your explanation</b>
      <div className="rec-row">
        {state === 'recording'
          ? <button className="btn btn-signal" onClick={() => rec.current?.stop()}><Icon name="pause" /> Stop ({seconds}s / 120s)</button>
          : <button className="btn btn-ink" onClick={startRec}><Icon name="mic" /> {state === 'done' ? 'Record again' : 'Start recording'}</button>}
        <span className="muted">or</span>
        <label className="btn btn-line file-btn">Upload audio<input type="file" accept="audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) take(f) }} /></label>
      </div>
      {state === 'done' && url && <audio controls src={url} className="rec-audio" />}
      <p className="muted">Up to 2 minutes. Say each step in order, naming the parts: “First, press the latch on the side…”</p>
      {err && <p className="note warn-note">{err}</p>}
    </div>
  )
}
