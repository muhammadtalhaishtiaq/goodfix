import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { api } from '../lib/api'
import { CATEGORIES, type Category } from '../lib/categories'
import { MAX_INPUT_BYTES } from '../lib/shrink-limits'
import type { DraftStep } from '../lib/steps'
import { uploadSigned } from '../lib/supabase'

type Upload = { path: string; token: string }
type Created = { id: string; uploads: { video: Upload; audio: Upload } }
export type KeyframeUpload = Upload & { idx: number; atS: number }
type Built = { steps: DraftStep[]; keyframeUploads: KeyframeUpload[] }
type Phase =
  | { name: 'form' }
  | { name: 'preparing'; progress: number }
  | { name: 'uploading' }
  | { name: 'building'; guideId: string; mp4Url: string }
  | { name: 'steps'; guideId: string; mp4Url: string; built: Built; ms: number }
  | { name: 'stepsFailed'; guideId: string; mp4Url: string; message: string }
  | { name: 'error'; message: string }

const CODE_KEY = 'showhow.accessCode'
const readCode = () => { try { return sessionStorage.getItem(CODE_KEY) ?? '' } catch { return '' } }
const saveCode = (c: string) => { try { sessionStorage.setItem(CODE_KEY, c) } catch { /* private mode: fine */ } }

export function CreateView() {
  const [phase, setPhase] = useState<Phase>({ name: 'form' })
  const [canShrink, setCanShrink] = useState<boolean | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Home')
  const [creatorName, setCreatorName] = useState('')
  const [code, setCode] = useState(readCode)
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [adult, setAdult] = useState(false)

  // Mediabunny is loaded only on this page, so the gallery stays light.
  useEffect(() => { import('../lib/shrink').then(m => m.canShrinkHere()).then(setCanShrink, () => setCanShrink(false)) }, [])

  const tooBig = !!file && file.size > MAX_INPUT_BYTES
  const ready = !!file && !tooBig && title.trim() && creatorName.trim() && code.trim() && consent && adult && canShrink

  async function start() {
    if (!file) return
    saveCode(code.trim())
    try {
      setPhase({ name: 'preparing', progress: 0 })
      const { shrinkVideo } = await import('../lib/shrink')
      const shrunk = await shrinkVideo(file, p => setPhase({ name: 'preparing', progress: p }))
      setPhase({ name: 'uploading' })
      const created = await api<Created>('guides', {
        title: title.trim(), category, creatorName: creatorName.trim(), durationS: shrunk.durationS, consent, adult,
      }, code.trim())
      await uploadSigned(created.uploads.video.path, created.uploads.video.token, shrunk.mp4)
      await uploadSigned(created.uploads.audio.path, created.uploads.audio.token, shrunk.wav)
      await buildSteps(created.id, URL.createObjectURL(shrunk.mp4))
    } catch (e) {
      setPhase({ name: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' })
    }
  }

  // Retry calls the same route; the server's status gate allows up to 3 attempts per guide.
  async function buildSteps(guideId: string, mp4Url: string) {
    setPhase({ name: 'building', guideId, mp4Url })
    const t0 = performance.now()
    try {
      const built = await api<Built>('steps', { guideId }, code.trim())
      setPhase({ name: 'steps', guideId, mp4Url, built, ms: performance.now() - t0 })
    } catch (e) {
      setPhase({ name: 'stepsFailed', guideId, mp4Url, message: e instanceof Error ? e.message : 'Something went wrong.' })
    }
  }

  return (
    <div className="c-wrap">
      <a className="back" href="#/"><Icon name="back" /> Gallery</a>
      <h1>Turn your video into a guide</h1>
      <p className="lead">Film yourself doing it once, talking as you go. Showhow splits it into steps in your own words and outlines the key part in each.</p>

      {phase.name === 'form' && (
        <div className="panel form-grid">
          {canShrink === false && <p className="note warn-note"><Icon name="alert" /><span>This browser can’t prepare video on your device. Please use desktop Chrome or Edge.</span></p>}
          <label className="fl">Guide title<input className="txt" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="e.g. Change the air purifier’s water" /></label>
          <label className="fl">Category
            <select className="txt" value={category} onChange={e => setCategory(e.target.value as Category)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="fl">Your name (shown on the guide)<input className="txt" value={creatorName} maxLength={60} onChange={e => setCreatorName(e.target.value)} /></label>
          <label className="fl">Access code<input className="txt" type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} /></label>

          <label className="drop span2">
            <span className="ic"><Icon name="upload" /></span>
            <b>{file ? file.name : 'Choose a video'}</b>
            <span className="muted">{file ? `${(file.size / 1e6).toFixed(0)} MB${tooBig ? ' · too large (max 500 MB)' : ''}` : 'Up to 3 minutes and 500 MB. Talk while you work: your words become the steps.'}</span>
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>

          <div className="span2 consent">
            <p><b>Before anything leaves your device</b></p>
            <ul className="recip">
              <li><Icon name="film" /><span><b>On this device</b>: your video is shrunk to 720p. The original never leaves your computer.</span><span className="tag">local</span></li>
              <li><Icon name="server" /><span><b>Showhow (Supabase storage)</b>: the shrunk video is stored, and public once you publish. The audio copy is deleted after transcription.</span><span className="tag">stores</span></li>
              <li><Icon name="eye" /><span><b>Meta Voice Transcribe, Muse Spark, SAM 3.1</b>: turn your narration into steps and outline the key parts. Not kept by Meta.</span><span className="tag">processes</span></li>
            </ul>
            <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree to this, and the video shows nothing private (faces, documents, addresses).</label>
            <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I’m 18 or older.</label>
          </div>

          <div className="actions span2"><span className="sp" /><button className="btn btn-primary" disabled={!ready} onClick={start}>Prepare and upload <Icon name="right" /></button></div>
        </div>
      )}

      {phase.name === 'preparing' && (
        <div className="panel" aria-live="polite">
          <p className="working"><span className="spin" aria-hidden="true" /> Preparing your video on this device… {Math.round(phase.progress * 100)}%</p>
          <div className="bar"><i style={{ width: `${phase.progress * 100}%` }} /></div>
          <p className="muted">Keep this tab open. Nothing has been uploaded yet.</p>
        </div>
      )}

      {phase.name === 'uploading' && (
        <div className="panel" aria-live="polite"><p className="working"><span className="spin" aria-hidden="true" /> Uploading the prepared video…</p></div>
      )}

      {phase.name === 'building' && (
        <div className="panel" aria-live="polite">
          <p className="working"><span className="spin" aria-hidden="true" /> Building steps from your narration…</p>
          <ul className="muted stage-list"><li>Meta Voice Transcribe: your words → text with timings</li><li>Meta Muse Spark: watches the video and splits it into steps</li><li>Showhow: checks every step and tip against what you actually said</li></ul>
          <p className="muted">Usually under a minute.</p>
        </div>
      )}

      {phase.name === 'stepsFailed' && (
        <div className="panel">
          <p className="note warn-note"><Icon name="alert" /><span>{phase.message}</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-primary" onClick={() => buildSteps(phase.guideId, phase.mp4Url)}>Try again</button></div>
        </div>
      )}

      {phase.name === 'steps' && (
        <div className="panel">
          <p className="note"><Icon name="check" /><span>{phase.built.steps.length} steps built in {(phase.ms / 1000).toFixed(0)} s, all in your own words.</span></p>
          <ol className="built-steps">
            {phase.built.steps.map(s => (
              <li key={s.idx}>
                <video src={`${phase.mp4Url}#t=${s.startS},${s.endS}`} muted playsInline preload="metadata" />
                <div><b>{s.idx + 1}. {s.title}</b><span className="muted"> · {s.startS.toFixed(0)}–{s.endS.toFixed(0)} s</span><p>{s.instruction}</p>
                  {s.tipQuote && <p className="muted">Tip, in your words: “{s.tipQuote}”</p>}</div>
              </li>
            ))}
          </ol>
          <p className="muted">Next: outlining the key part in each step.</p>
        </div>
      )}

      {phase.name === 'error' && (
        <div className="panel">
          <p className="note warn-note"><Icon name="alert" /><span>{phase.message}</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-primary" onClick={() => setPhase({ name: 'form' })}>Try again</button></div>
        </div>
      )}
    </div>
  )
}
