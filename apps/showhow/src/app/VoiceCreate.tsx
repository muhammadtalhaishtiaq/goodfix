import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { api, apiRaw } from '../lib/api'
import { GuideFields, HowWeCheck, ReviewMetaEditor, type CategoryChoice, type ReviewMeta } from '../components/CreateFields'
import type { Category } from '../lib/categories'
import type { DraftStep } from '../lib/steps'
import { STYLE_IDS, STYLES, type StyleId } from '../lib/styles'
import { mediaUrl } from '../lib/supabase'
import { Published } from './CreateView'

type Img = { idx: number; ok: boolean }
type ReviewStep = DraftStep & { ok: boolean; keep: boolean }
type Phase =
  | { name: 'form' }
  | { name: 'checking' }
  | { name: 'blocked'; message: string }
  | { name: 'illustrating'; guideId: string; steps: DraftStep[]; meta: ReviewMeta }
  | { name: 'review'; guideId: string; steps: ReviewStep[]; v: number; meta: ReviewMeta }
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
    setPhase({ name: 'checking' })
    try {
      const { toWav16k } = await import('../lib/shrink')
      const { wav } = await toWav16k(audio)
      const out = await apiRaw<{ id: string; steps: DraftStep[]; missing: string[]; title: string; category: Category }>('voice-guides', wav, { title: title.trim(), category, creatorName: creatorName.trim(), style, consent, adult }, key())
      await illustrate(out.id, out.steps, { title: out.title, category: out.category, missing: out.missing })
    } catch (e) {
      const m = message(e)
      setPhase(m.includes('Nothing was saved') ? { name: 'blocked', message: m } : { name: 'error', message: m })
    }
  }

  async function illustrate(guideId: string, steps: DraftStep[], meta: ReviewMeta) {
    setPhase({ name: 'illustrating', guideId, steps, meta })
    try {
      const { images } = await api<{ images: Img[] }>('voice-images', { guideId }, key())
      const ok = new Map(images.map(i => [i.idx, i.ok]))
      setPhase({ name: 'review', guideId, meta, v: Date.now(), steps: steps.map(s => ({ ...s, ok: !!ok.get(s.idx), keep: !!ok.get(s.idx) })) })
    } catch (e) {
      setPhase({ name: 'error', message: message(e), retry: () => illustrate(guideId, steps, meta) })
    }
  }

  async function publish(p: Extract<Phase, { name: 'review' }>) {
    setPhase({ name: 'publishing' })
    try {
      const out = await api<{ path: string }>('publish', { guideId: p.guideId, title: p.meta.title.trim(), category: p.meta.category, edits: p.steps.map(s => ({ idx: s.idx, title: s.title, instruction: s.instruction, dropAiImage: s.ok && !s.keep })) }, key())
      setPhase({ name: 'published', path: out.path, title: p.meta.title.trim() })
    } catch (e) {
      setPhase({ name: 'error', message: message(e), retry: () => publish(p) })
    }
  }

  const edit = (idx: number, patch: Partial<ReviewStep>) =>
    setPhase(p => (p.name === 'review' ? { ...p, steps: p.steps.map(s => (s.idx === idx ? { ...s, ...patch } : s)) } : p))

  return (
    <div className="c-wrap">
      <a className="back" href="#/"><Icon name="back" /> Gallery</a>
      <h1>Talk it through</h1>
      <p className="lead">No video? Explain the fix out loud, step by step. Showhow checks it’s a clear, safe how-to, writes the steps in your words, and illustrates each one.</p>
      <CreateTabs active="voice" />

      {phase.name === 'form' && (
        <div className="panel form-grid">
          <GuideFields title={title} setTitle={setTitle} category={category} setCategory={setCategory} code={code} setCode={setCode} source="voice" />
          <label className="fl">Your name (shown on the guide)<input className="txt" value={creatorName} maxLength={60} onChange={e => setCreatorName(e.target.value)} /></label>

          <div className="span2"><Recorder onAudio={setAudio} /></div>

          <fieldset className="span2 styles">
            <legend><b>Illustration style</b> <span className="muted">(every image is labelled “Illustration by AI”)</span></legend>
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

          <HowWeCheck source="voice" />
          <div className="span2 consent">
            <p><b>Before anything leaves your device</b></p>
            <ul className="recip">
              <li><Icon name="server" /><span><b>Showhow</b>: checks the recording in memory. <b>Nothing is stored unless it passes</b> the safety check; the recording itself is never stored.</span><span className="tag">checks</span></li>
              <li><Icon name="eye" /><span><b>Meta Voice Transcribe, Muse Spark, Muse Image</b>: turn your words into checked steps and illustrations. Sent with Meta’s response storage turned off; Meta’s terms apply.</span><span className="tag">processes</span></li>
              <li><Icon name="link" /><span><b>Once you publish</b>: the steps and illustrations are public.</span><span className="tag">public</span></li>
            </ul>
            <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree to this.</label>
            <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I’m 18 or older.</label>
          </div>
          <div className="actions span2"><span className="sp" /><button className="btn btn-primary" disabled={!ready} onClick={start}>Check and build <Icon name="right" /></button></div>
        </div>
      )}

      {phase.name === 'checking' && (
        <div className="panel" aria-live="polite">
          <p className="working"><span className="spin" aria-hidden="true" /> Checking your recording…</p>
          <ul className="muted stage-list"><li>Meta Voice Transcribe: your words → text</li><li>Safety rules + Meta Muse Spark: is it a clear, complete, safe how-to?</li><li>Muse Spark: steps in your own words</li></ul>
          <p className="muted">Nothing is saved unless every check passes.</p>
        </div>
      )}

      {phase.name === 'blocked' && (
        <div className="panel">
          <p className="note warn-note"><Icon name="shield" /><span>{phase.message}</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-primary" onClick={() => { setAudio(null); setPhase({ name: 'form' }) }}>Record again</button></div>
        </div>
      )}

      {phase.name === 'illustrating' && (
        <div className="panel" aria-live="polite">
          <p className="working"><span className="spin" aria-hidden="true" /> Meta Muse Image is illustrating {phase.steps.length} steps in “{STYLES[style].label}”…</p>
          <p className="muted">One base picture, then each step drawn from it so the object stays the same. About a minute.</p>
        </div>
      )}

      {phase.name === 'review' && (
        <div className="panel">
          <p className="note"><Icon name="check" /><span>Passed our topic check and reads as a clear how-to. AI can be wrong: review each step, then publish.</span></p>
          <ReviewMetaEditor meta={phase.meta} onChange={meta => setPhase(p => (p.name === 'review' ? { ...p, meta } : p))} />
          <ol className="built-steps">
            {phase.steps.map(s => (
              <li key={s.idx}>
                <div className="frame">
                  {s.ok && s.keep ? <img src={`${mediaUrl(`${phase.guideId}/${s.idx}-ai-focus.jpg`)}?v=${phase.v}`} alt={`Illustration of step ${s.idx + 1}`} /> : <span className="ph">No illustration</span>}
                  <span className="frame-tag">Illustration by AI</span>
                </div>
                <div className="edit">
                  <label className="fl">Step {s.idx + 1} title<input className="txt" value={s.title} maxLength={60} onChange={e => edit(s.idx, { title: e.target.value })} /></label>
                  <label className="fl">Instruction<textarea value={s.instruction} maxLength={300} onChange={e => edit(s.idx, { instruction: e.target.value })} /></label>
                  {s.ok && <label className="check"><input type="checkbox" checked={s.keep} onChange={e => edit(s.idx, { keep: e.target.checked })} /> Keep this illustration (untick if it shows something wrong)</label>}
                </div>
              </li>
            ))}
          </ol>
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => illustrate(phase.guideId, phase.steps, phase.meta)}>Redraw all illustrations</button>
            <span className="sp" />
            <button className="btn btn-primary" disabled={!phase.meta.title.trim() || phase.steps.some(s => !s.title.trim() || !s.instruction.trim())} onClick={() => publish(phase)}><Icon name="check" /> Publish guide</button>
          </div>
        </div>
      )}

      {phase.name === 'publishing' && <div className="panel"><p className="working"><span className="spin" aria-hidden="true" /> Publishing…</p></div>}
      {phase.name === 'published' && <Published path={phase.path} title={phase.title} />}
      {phase.name === 'error' && (
        <div className="panel">
          <p className="note warn-note"><Icon name="alert" /><span>{phase.message}</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-primary" onClick={phase.retry ?? (() => setPhase({ name: 'form' }))}>Try again</button></div>
        </div>
      )}
    </div>
  )
}

export function CreateTabs({ active }: { active: 'video' | 'voice' }) {
  return (
    <div className="chips create-tabs" role="tablist" aria-label="How do you want to share it?">
      <a className="chip" role="tab" aria-selected={active === 'video'} aria-pressed={active === 'video'} href="#/create"><Icon name="film" /> Film it</a>
      <a className="chip" role="tab" aria-selected={active === 'voice'} aria-pressed={active === 'voice'} href="#/create/voice"><Icon name="mic" /> Talk it through</a>
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
    <div className="recorder">
      <div className="rec-row">
        {state === 'recording'
          ? <button className="btn btn-signal" onClick={() => rec.current?.stop()}><Icon name="pause" /> Stop ({seconds}s / 120s)</button>
          : <button className="btn btn-primary" onClick={startRec}><Icon name="mic" /> {state === 'done' ? 'Record again' : 'Start recording'}</button>}
        <span className="muted">or</span>
        <label className="btn btn-ghost file-btn"><Icon name="upload" /> Upload audio<input type="file" accept="audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) take(f) }} /></label>
      </div>
      {state === 'done' && url && <audio controls src={url} className="rec-audio" />}
      <p className="muted">Up to 2 minutes. Say each step in order, naming the parts: “First, press the latch on the side…”</p>
      {err && <p className="note warn-note"><Icon name="alert" /><span>{err}</span></p>}
    </div>
  )
}
