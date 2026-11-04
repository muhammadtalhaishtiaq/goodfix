import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { OutlineOverlay } from '../components/OutlineOverlay'
import { StageTicks } from '../components/StageTicks'
import { api, apiStream } from '../lib/api'
import { GuideFields, HowWeCheck, ReviewMetaEditor, WhoKeepsWhat, type CategoryChoice, type Duplicate, type ReviewMeta } from '../components/CreateFields'
import type { Category } from '../lib/categories'
import { captureFrame } from '../lib/image'
import { MAX_INPUT_BYTES } from '../lib/shrink-limits'
import type { DraftStep } from '../lib/steps'
import { mediaUrl, uploadSigned } from '../lib/supabase'
import type { Outline } from '../lib/types'
import { videoProblems } from '../lib/precheck'
import { CreateTabs, LocalCheck, type Local } from './VoiceCreate'

type Upload = { path: string; token: string }
type Created = { id: string; uploads: { video: Upload; audio: Upload } }
type KeyframeUpload = Upload & { idx: number; atS: number }
type Built = { steps: DraftStep[]; keyframeUploads: KeyframeUpload[]; title: string; category: Category; missing: string[]; duplicate: Duplicate | null }
type OutlineResult = { idx: number; keyframe: boolean; outline: Outline | null }
type Enh = 'off' | 'drawing' | 'ok' | 'failed'
type ReviewStep = DraftStep & { frameUrl?: string; outline: Outline | null; enh: Enh; keepEnhanced: boolean }
type Ctx = { guideId: string; mp4Url: string }
type Phase =
  | { name: 'form' }
  | { name: 'preparing'; progress: number }
  | { name: 'uploading' }
  | ({ name: 'building'; stages: string[] } & Ctx)
  | ({ name: 'framing'; done: number; total: number } & Ctx)
  | ({ name: 'review'; steps: ReviewStep[]; buildMs: number; meta: ReviewMeta } & Ctx)
  | ({ name: 'publishing' } & Ctx)
  | { name: 'published'; path: string; title: string }
  | ({ name: 'stageFailed'; message: string; retry: () => void; stages?: string[] } & Partial<Ctx>)
  | { name: 'error'; message: string }

const CODE_KEY = 'showhow.accessCode'
const readCode = () => { try { return sessionStorage.getItem(CODE_KEY) ?? '' } catch { return '' } }
const saveCode = (c: string) => { try { sessionStorage.setItem(CODE_KEY, c) } catch { /* private mode: fine */ } }
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

export function CreateView() {
  const [phase, setPhase] = useState<Phase>({ name: 'form' })
  const [canShrink, setCanShrink] = useState<boolean | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryChoice>('auto')
  const [creatorName, setCreatorName] = useState('')
  const [code, setCode] = useState(readCode)
  const [file, setFile] = useState<File | null>(null)
  const [local, setLocal] = useState<Local>({ state: 'none', problems: [] })
  const latest = useRef<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [adult, setAdult] = useState(false)
  const [enhance, setEnhance] = useState(false)

  // Mediabunny is loaded only on this page, so the gallery stays light.
  useEffect(() => { import('../lib/shrink').then(m => m.canShrinkHere()).then(setCanShrink, () => setCanShrink(false)) }, [])

  const tooBig = !!file && file.size > MAX_INPUT_BYTES
  const ready = !!file && local.state === 'ok' && creatorName.trim() && code.trim() && consent && adult && canShrink

  // Instant checks on this device (nothing is sent): reads only the file header.
  async function pickFile(f: File | null) {
    setFile(f)
    latest.current = f
    if (!f) return setLocal({ state: 'none', problems: [] })
    setLocal({ state: 'checking', problems: [] })
    let next: Local
    try {
      const { probeVideo } = await import('../lib/shrink')
      const v = await probeVideo(f)
      const problems = videoProblems({ bytes: f.size, ...v })
      next = { state: problems.length ? 'bad' : 'ok', durationS: v.durationS, problems }
    } catch {
      next = { state: 'bad', problems: ['We couldn’t read this file. Try an MP4 or MOV video.'] }
    }
    if (latest.current === f) setLocal(next)
  }
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
    setPhase({ name: 'building', ...ctx, stages: [] })
    const t0 = performance.now()
    let built: Built
    try {
      built = await apiStream<Built>('steps', { json: { guideId: ctx.guideId } }, key(),
        e => setPhase(p => (p.name === 'building' ? { ...p, stages: [...p.stages, e.stage] } : p)))
    } catch (e) {
      return setPhase(p => ({ name: 'stageFailed', ...ctx, message: message(e), retry: () => buildSteps(ctx), stages: p.name === 'building' ? p.stages : undefined }))
    }
    await outlineSteps(ctx, built, performance.now() - t0)
  }

  async function outlineSteps(ctx: Ctx, built: Built, buildMs: number) {
    const total = built.keyframeUploads.length
    const frames: Record<number, string> = {}
    try {
      for (const [i, k] of built.keyframeUploads.entries()) {
        setPhase({ name: 'framing', ...ctx, done: i, total })
        const jpg = await grabFrame(ctx.mp4Url, k.atS)
        await uploadSigned(k.path, k.token, jpg)
        frames[k.idx] = URL.createObjectURL(jpg)
      }
      setPhase({ name: 'framing', ...ctx, done: total, total })
      const { outlines } = await api<{ outlines: OutlineResult[] }>('outlines', { guideId: ctx.guideId }, key())
      const byIdx = new Map(outlines.map(o => [o.idx, o.outline]))
      const steps: ReviewStep[] = built.steps.map(s => ({ ...s, frameUrl: frames[s.idx], outline: byIdx.get(s.idx) ?? null, enh: enhance ? 'drawing' : 'off', keepEnhanced: false }))
      setPhase({ name: 'review', ...ctx, buildMs, steps, meta: { title: built.title, category: built.category, missing: built.missing ?? [], duplicate: built.duplicate } })
      if (enhance) void enhanceSteps(ctx, steps.map(s => s.idx)) // stills fill in per step while the creator reviews (F9)
    } catch (e) {
      setPhase({ name: 'stageFailed', ...ctx, message: message(e), retry: () => outlineSteps(ctx, built, buildMs) })
    }
  }

  // Optional (T18), one call per step in parallel. A failure never blocks the guide: that step keeps its real frame.
  async function enhanceSteps(ctx: Ctx, idxs: number[]) {
    await Promise.all(idxs.map(async idx => {
      let ok = false
      try { ok = (await api<{ ok: boolean }>('enhance', { guideId: ctx.guideId, idx }, key())).ok } catch { ok = false }
      editStep(idx, { enh: ok ? 'ok' : 'failed', keepEnhanced: ok })
    }))
  }

  async function publish(ctx: Ctx, steps: ReviewStep[], meta: ReviewMeta) {
    setPhase({ name: 'publishing', ...ctx })
    try {
      const out = await api<{ path: string }>('publish', { guideId: ctx.guideId, title: meta.title.trim(), category: meta.category, edits: steps.map(s => ({ idx: s.idx, title: s.title, instruction: s.instruction, dropAiImage: s.enh === 'ok' && !s.keepEnhanced })) }, key())
      setPhase({ name: 'published', path: out.path, title: meta.title.trim() })
    } catch (e) {
      setPhase({ name: 'stageFailed', ...ctx, message: message(e), retry: () => publish(ctx, steps, meta) })
    }
  }

  const editStep = (idx: number, patch: Partial<ReviewStep>) =>
    setPhase(p => (p.name === 'review' ? { ...p, steps: p.steps.map(s => (s.idx === idx ? { ...s, ...patch } : s)) } : p))

  return (
    <div className="narrow">
      <h1>Share how you do it</h1>
      <p className="sub">Film yourself doing it once, talking as you go. Showhow splits it into steps in your own words and outlines the key part in each.</p>
      <CreateTabs active="video" />

      {phase.name === 'form' && (
        <div className="cform">
          <label className="drop">
            <span className="drop-ic"><Icon name="upload" /></span>
            <b className="big">{file ? file.name : 'Choose a video'}</b>
            <span className="muted">{file ? `${(file.size / 1e6).toFixed(0)} MB${tooBig ? ' · too large (max 500 MB)' : ''}` : 'Up to 3 minutes and 500 MB. Talk while you work: your words become the steps.'}</span>
            <span className="btn btn-ink" aria-hidden="true">{file ? 'Choose another' : 'Choose file'}</span>
            <input type="file" accept="video/*,.mov,.mp4,.m4v,.webm" onChange={e => pickFile(e.target.files?.[0] ?? null)} />
          </label>
          <LocalCheck local={local} what="video" />
          {canShrink === false && <p className="note warn-note">This browser can’t prepare video on your device. Please use desktop Chrome or Edge.</p>}

          <GuideFields title={title} setTitle={setTitle} category={category} setCategory={setCategory} creatorName={creatorName} setCreatorName={setCreatorName} code={code} setCode={setCode} source="video" />

          <HowWeCheck source="video" />
          <WhoKeepsWhat rows={[
            { who: 'This device', what: 'Your video is shrunk to 720p. The original never leaves your computer.', keeps: 'Local' },
            { who: 'Showhow (Supabase storage)', what: 'The shrunk video and one still per step are stored, public once you publish. The audio copy is deleted after transcription.', keeps: 'Stores' },
            { who: 'Meta Voice Transcribe, Muse Spark, SAM 3.1', what: 'Turn your narration into steps and outline the key parts. Sent with Meta’s response storage turned off; Meta’s terms apply.', keeps: 'Processes' },
          ]} />
          <div className="consent">
            <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree to this, and the video shows nothing private (faces, documents, addresses).</label>
            <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I’m 18 or older.</label>
            <label className="check"><input type="checkbox" checked={enhance} onChange={e => setEnhance(e.target.checked)} /> Optional: also make a cleaner “Enhanced by AI” still of each step (Meta Muse Image). Learners can always switch back to your real video, and checks always use your real frames.</label>
          </div>

          <p className="note"><span><b>Nothing is uploaded until you press Prepare and upload.</b> Then your narration is transcribed, checked against our topic rules, and reviewed by Meta Muse Spark before any steps are written. If a check fails, we stop and show you why.</span></p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" disabled={!ready} onClick={start}>Prepare and upload</button></div>
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
        <div className="panel">
          <h2>Checking your narration, then finding the steps</h2>
          <p className="muted">Usually under a minute. Keep this tab open.</p>
          <StageTicks done={phase.stages} />
        </div>
      )}

      {phase.name === 'framing' && (
        <Working text={phase.done < phase.total ? `Taking a still of each step… ${phase.done + 1} of ${phase.total}` : 'Outlining the key part in each step…'} />
      )}

      {phase.name === 'review' && (
        <div className="panel wide">
          <h2>Review your steps</h2>
          <p className="note">{phase.steps.length} steps in your own words. Check them, fix anything, then publish.</p>
          <ReviewMetaEditor meta={phase.meta} onChange={meta => setPhase(p => (p.name === 'review' ? { ...p, meta } : p))} />
          <ol className="rgrid">
            {phase.steps.map(s => (
              <li key={s.idx} className="rc">
                <div className="rimg">
                  {s.frameUrl ? <img src={s.frameUrl} alt={`Step ${s.idx + 1}, your real frame`} /> : <span className="ph">No still</span>}
                  {s.outline && <OutlineOverlay outline={s.outline} label={s.keyPart} />}
                  <span className="mono tag">Step {s.idx + 1} · {s.outline ? `outlined: ${s.keyPart}` : 'no confident outline'}</span>
                </div>
                <label><span className="sr">Step {s.idx + 1} title</span><input className="txt" value={s.title} maxLength={60} onChange={e => editStep(s.idx, { title: e.target.value })} /></label>
                <label><span className="sr">Step {s.idx + 1} instruction</span><textarea value={s.instruction} maxLength={300} onChange={e => editStep(s.idx, { instruction: e.target.value })} /></label>
                <span className="mono muted">{s.startS.toFixed(0)}–{s.endS.toFixed(0)} s</span>
                {s.tipQuote && <span className="muted">Tip: “{s.tipQuote}”</span>}
                {s.enh !== 'off' && (
                  <div className="enh">
                    <div className="rimg ai">{s.enh === 'ok' ? <img src={mediaUrl(`${phase.guideId}/${s.idx}-ai.jpg`)} alt={`Enhanced still of step ${s.idx + 1}`} /> : s.enh === 'drawing' ? <span className="shim">Enhancing…</span> : <span className="ph">Not enhanced</span>}
                      <span className="mono tag tag-ai">Enhanced by AI</span></div>
                    {s.enh === 'ok' && <label className="check"><input type="checkbox" checked={s.keepEnhanced} onChange={e => editStep(s.idx, { keepEnhanced: e.target.checked })} /> Keep “Enhanced by AI”</label>}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="actions"><span className="sp" />
            <button className="btn btn-ink" disabled={!phase.meta.title.trim() || phase.steps.some(s => !s.title.trim() || !s.instruction.trim())} onClick={() => publish(phase, phase.steps, phase.meta)}>Publish guide</button>
          </div>
        </div>
      )}

      {phase.name === 'publishing' && <Working text="Publishing…" />}

      {phase.name === 'published' && <Published path={phase.path} title={phase.title} />}

      {phase.name === 'stageFailed' && (
        <div className="panel">
          {phase.stages && <><h2>We stopped at this check</h2><StageTicks done={phase.stages} failed /></>}
          <p className="note warn-note" role="alert">{phase.message}</p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" onClick={phase.retry}>Try again</button></div>
        </div>
      )}

      {phase.name === 'error' && (
        <div className="panel">
          <p className="note warn-note">{phase.message}</p>
          <div className="actions"><span className="sp" /><button className="btn btn-ink" onClick={() => setPhase({ name: 'form' })}>Try again</button></div>
        </div>
      )}
    </div>
  )
}

// WebCodecs first (works wherever the shrink worked, incl. phones); the <video> route only as a fallback.
async function grabFrame(mp4Url: string, atS: number): Promise<Blob> {
  try {
    const [{ frameAt }, mp4] = await Promise.all([import('../lib/shrink'), fetch(mp4Url).then(r => r.blob())])
    return await frameAt(mp4, atS)
  } catch {
    return captureFrame(mp4Url, atS)
  }
}

function Working({ text }: { text: string }) {
  return <div className="panel" aria-live="polite"><p className="working"><span className="spin" aria-hidden="true" /> {text}</p></div>
}

export function Published({ path, title }: { path: string; title: string }) {
  const url = `${location.origin}${location.pathname}${path}`
  const [copied, setCopied] = useState(false)
  return (
    <div className="panel share">
      <h2>“{title}” is live</h2>
      <p className="muted">Anyone with the link can follow it, no account needed.</p>
      <div className="linkbox"><code>{url}</code>
        <button className="btn btn-ink" onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
      <div className="actions"><a className="btn btn-line" href={path}>Open as a learner</a><a className="btn btn-line" href="#/">All guides</a></div>
    </div>
  )
}
