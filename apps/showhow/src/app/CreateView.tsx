import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { OutlineOverlay } from '../components/OutlineOverlay'
import { api } from '../lib/api'
import { CATEGORIES, type Category } from '../lib/categories'
import { captureFrame } from '../lib/image'
import { MAX_INPUT_BYTES } from '../lib/shrink-limits'
import type { DraftStep } from '../lib/steps'
import { uploadSigned } from '../lib/supabase'
import type { Outline } from '../lib/types'
import { CreateTabs } from './VoiceCreate'

type Upload = { path: string; token: string }
type Created = { id: string; uploads: { video: Upload; audio: Upload } }
type KeyframeUpload = Upload & { idx: number; atS: number }
type Built = { steps: DraftStep[]; keyframeUploads: KeyframeUpload[] }
type OutlineResult = { idx: number; keyframe: boolean; outline: Outline | null }
type ReviewStep = DraftStep & { frameUrl?: string; outline: Outline | null }
type Ctx = { guideId: string; mp4Url: string }
type Phase =
  | { name: 'form' }
  | { name: 'preparing'; progress: number }
  | { name: 'uploading' }
  | ({ name: 'building' } & Ctx)
  | ({ name: 'framing'; done: number; total: number } & Ctx)
  | ({ name: 'review'; steps: ReviewStep[]; buildMs: number } & Ctx)
  | ({ name: 'publishing' } & Ctx)
  | { name: 'published'; path: string; title: string }
  | ({ name: 'stageFailed'; message: string; retry: () => void } & Partial<Ctx>)
  | { name: 'error'; message: string }

const CODE_KEY = 'showhow.accessCode'
const readCode = () => { try { return sessionStorage.getItem(CODE_KEY) ?? '' } catch { return '' } }
const saveCode = (c: string) => { try { sessionStorage.setItem(CODE_KEY, c) } catch { /* private mode: fine */ } }
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

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
  const key = () => code.trim()

  async function start() {
    if (!file) return
    saveCode(key())
    try {
      setPhase({ name: 'preparing', progress: 0 })
      const { shrinkVideo } = await import('../lib/shrink')
      const shrunk = await shrinkVideo(file, p => setPhase({ name: 'preparing', progress: p }))
      setPhase({ name: 'uploading' })
      const created = await api<Created>('guides', { title: title.trim(), category, creatorName: creatorName.trim(), durationS: shrunk.durationS, consent, adult }, key())
      await uploadSigned(created.uploads.video.path, created.uploads.video.token, shrunk.mp4)
      await uploadSigned(created.uploads.audio.path, created.uploads.audio.token, shrunk.wav)
      await buildSteps({ guideId: created.id, mp4Url: URL.createObjectURL(shrunk.mp4) })
    } catch (e) {
      setPhase({ name: 'error', message: message(e) })
    }
  }

  // Each stage can be retried; the server's status gate allows up to 3 consecutive attempts.
  async function buildSteps(ctx: Ctx) {
    setPhase({ name: 'building', ...ctx })
    const t0 = performance.now()
    let built: Built
    try {
      built = await api<Built>('steps', { guideId: ctx.guideId }, key())
    } catch (e) {
      return setPhase({ name: 'stageFailed', ...ctx, message: message(e), retry: () => buildSteps(ctx) })
    }
    await outlineSteps(ctx, built, performance.now() - t0)
  }

  async function outlineSteps(ctx: Ctx, built: Built, buildMs: number) {
    const total = built.keyframeUploads.length
    const frames: Record<number, string> = {}
    try {
      for (const [i, k] of built.keyframeUploads.entries()) {
        setPhase({ name: 'framing', ...ctx, done: i, total })
        const jpg = await captureFrame(ctx.mp4Url, k.atS)
        await uploadSigned(k.path, k.token, jpg)
        frames[k.idx] = URL.createObjectURL(jpg)
      }
      setPhase({ name: 'framing', ...ctx, done: total, total })
      const { outlines } = await api<{ outlines: OutlineResult[] }>('outlines', { guideId: ctx.guideId }, key())
      const byIdx = new Map(outlines.map(o => [o.idx, o.outline]))
      setPhase({ name: 'review', ...ctx, buildMs, steps: built.steps.map(s => ({ ...s, frameUrl: frames[s.idx], outline: byIdx.get(s.idx) ?? null })) })
    } catch (e) {
      setPhase({ name: 'stageFailed', ...ctx, message: message(e), retry: () => outlineSteps(ctx, built, buildMs) })
    }
  }

  async function publish(ctx: Ctx, steps: ReviewStep[]) {
    setPhase({ name: 'publishing', ...ctx })
    try {
      const out = await api<{ path: string }>('publish', { guideId: ctx.guideId, edits: steps.map(s => ({ idx: s.idx, title: s.title, instruction: s.instruction })) }, key())
      setPhase({ name: 'published', path: out.path, title: title.trim() })
    } catch (e) {
      setPhase({ name: 'stageFailed', ...ctx, message: message(e), retry: () => publish(ctx, steps) })
    }
  }

  const editStep = (idx: number, patch: Partial<ReviewStep>) =>
    setPhase(p => (p.name === 'review' ? { ...p, steps: p.steps.map(s => (s.idx === idx ? { ...s, ...patch } : s)) } : p))

  return (
    <div className="c-wrap">
      <a className="back" href="#/"><Icon name="back" /> Gallery</a>
      <h1>Turn your video into a guide</h1>
      <p className="lead">Film yourself doing it once, talking as you go. Showhow splits it into steps in your own words and outlines the key part in each.</p>
      <CreateTabs active="video" />

      {phase.name === 'form' && (
        <div className="panel form-grid">
          {canShrink === false && <p className="note warn-note span2"><Icon name="alert" /><span>This browser can’t prepare video on your device. Please use desktop Chrome or Edge.</span></p>}
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
              <li><Icon name="server" /><span><b>Showhow (Supabase storage)</b>: the shrunk video and one still per step are stored, public once you publish. The audio copy is deleted after transcription.</span><span className="tag">stores</span></li>
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

      {phase.name === 'uploading' && <Working text="Uploading the prepared video…" />}

      {phase.name === 'building' && (
        <div className="panel" aria-live="polite">
          <p className="working"><span className="spin" aria-hidden="true" /> Building steps from your narration…</p>
          <ul className="muted stage-list"><li>Meta Voice Transcribe: your words → text with timings</li><li>Meta Muse Spark: watches the video and splits it into steps</li><li>Showhow: checks every step and tip against what you actually said</li></ul>
          <p className="muted">Usually under a minute.</p>
        </div>
      )}

      {phase.name === 'framing' && (
        <Working text={phase.done < phase.total ? `Taking a still of each step… ${phase.done + 1} of ${phase.total}` : 'Meta SAM 3.1 is outlining the key part in each step…'} />
      )}

      {phase.name === 'review' && (
        <div className="panel">
          <p className="note"><Icon name="check" /><span>{phase.steps.length} steps in your own words. Check them, fix anything, then publish.</span></p>
          <ol className="built-steps">
            {phase.steps.map(s => (
              <li key={s.idx}>
                <div className="frame">
                  {s.frameUrl ? <img src={s.frameUrl} alt={`Step ${s.idx + 1}`} /> : <span className="ph">No still</span>}
                  {s.outline && <OutlineOverlay outline={s.outline} label={s.keyPart} />}
                  <span className="frame-tag">{s.outline ? `Outlined: ${s.keyPart}` : 'No confident outline'}</span>
                </div>
                <div className="edit">
                  <label className="fl">Step {s.idx + 1} title<input className="txt" value={s.title} maxLength={60} onChange={e => editStep(s.idx, { title: e.target.value })} /></label>
                  <label className="fl">Instruction<textarea value={s.instruction} maxLength={300} onChange={e => editStep(s.idx, { instruction: e.target.value })} /></label>
                  <span className="muted">{s.startS.toFixed(0)}–{s.endS.toFixed(0)} s{s.tipQuote ? ` · tip, in your words: “${s.tipQuote}”` : ''}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="actions"><span className="sp" />
            <button className="btn btn-primary" disabled={phase.steps.some(s => !s.title.trim() || !s.instruction.trim())} onClick={() => publish(phase, phase.steps)}><Icon name="check" /> Publish guide</button>
          </div>
        </div>
      )}

      {phase.name === 'publishing' && <Working text="Publishing…" />}

      {phase.name === 'published' && <Published path={phase.path} title={phase.title} />}

      {phase.name === 'stageFailed' && (
        <div className="panel">
          <p className="note warn-note"><Icon name="alert" /><span>{phase.message}</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-primary" onClick={phase.retry}>Try again</button></div>
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

function Working({ text }: { text: string }) {
  return <div className="panel" aria-live="polite"><p className="working"><span className="spin" aria-hidden="true" /> {text}</p></div>
}

export function Published({ path, title }: { path: string; title: string }) {
  const url = `${location.origin}${location.pathname}${path}`
  const [copied, setCopied] = useState(false)
  return (
    <div className="panel share">
      <span className="ok-ic"><Icon name="check" /></span>
      <h2>“{title}” is live</h2>
      <p className="muted">Anyone with the link can follow it, no account needed.</p>
      <div className="linkbox"><code>{url}</code>
        <button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))}><Icon name="link" /> {copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="actions"><a className="btn btn-ghost" href={path}><Icon name="eye" /> Open as a learner</a><a className="btn btn-ghost" href="#/">Gallery</a></div>
    </div>
  )
}
