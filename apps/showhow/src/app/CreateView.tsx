import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { api } from '../lib/api'
import { CATEGORIES, type Category } from '../lib/categories'
import { MAX_INPUT_BYTES } from '../lib/shrink-limits'
import { uploadSigned } from '../lib/supabase'

type Upload = { path: string; token: string }
type Created = { id: string; uploads: { video: Upload; audio: Upload } }
type Phase =
  | { name: 'form' }
  | { name: 'preparing'; progress: number }
  | { name: 'uploading' }
  | { name: 'uploaded'; guideId: string; mp4Url: string; mb: number; seconds: number; ms: number }
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
      setPhase({ name: 'uploaded', guideId: created.id, mp4Url: URL.createObjectURL(shrunk.mp4), mb: shrunk.mp4.size / 1e6, seconds: shrunk.durationS, ms: shrunk.ms })
    } catch (e) {
      setPhase({ name: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' })
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

      {phase.name === 'uploaded' && (
        <div className="panel">
          <p className="note"><Icon name="check" /><span>Uploaded: {phase.mb.toFixed(1)} MB, {Math.round(phase.seconds)} s (prepared in {(phase.ms / 1000).toFixed(0)} s).</span></p>
          <video className="preview" src={phase.mp4Url} controls muted playsInline />
          <p className="muted">Next: building the steps from your narration.</p>
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
