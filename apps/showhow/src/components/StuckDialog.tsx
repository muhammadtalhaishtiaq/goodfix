import { useEffect, useRef, useState } from 'react'
import { isValidOutline } from '../lib/geometry'
import type { CheckRequest, CheckResult, Guide } from '../lib/types'
import { Icon } from './Icon'
import { OutlineOverlay } from './OutlineOverlay'

type Props = {
  guide: Guide
  stepIdx: number
  mode: 'stuck' | 'where'
  check: (req: CheckRequest) => Promise<CheckResult>
  onClose: () => void
  onGoToStep: (idx: number) => void
}
type Phase = 'choose' | 'review' | 'working' | 'result' | 'error'
type Photo = { file: File; url: string }

const ADULT_KEY = 'showhow.adult'
const wasAdult = () => { try { return sessionStorage.getItem(ADULT_KEY) === '1' } catch { return false } }

export function StuckDialog({ guide, stepIdx, mode, check, onClose, onGoToStep }: Props) {
  const [phase, setPhase] = useState<Phase>('choose')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [errorText, setErrorText] = useState('')
  const [adult, setAdult] = useState(wasAdult) // Meta API Terms: 18+, asked once per session
  const headRef = useRef<HTMLHeadingElement>(null)
  const step = guide.steps[stepIdx]

  useEffect(() => headRef.current?.focus(), [phase])
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  // A new photo is a new payload: it always lands on the review screen, never auto-sends.
  function pick(file: File | undefined) {
    if (!file) return
    setPhoto({ file, url: URL.createObjectURL(file) })
    setResult(null)
    setPhase('review')
  }

  async function send() {
    if (!photo || !adult) return
    try { sessionStorage.setItem(ADULT_KEY, '1') } catch { /* private mode: ask again next time */ }
    setPhase('working')
    try {
      setResult(await check({ guideId: guide.id, stepIdx, mode, photo: photo.file, question: question.trim() || undefined }))
      setPhase('result')
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : '')
      setPhase('error')
    }
  }

  const titles: Record<Phase, string> = {
    choose: mode === 'where' ? 'Where am I?' : `Stuck on step ${stepIdx + 1}?`,
    review: 'Check before sending',
    working: 'Checking your photo…',
    result: mode === 'where' ? 'Found your place' : 'Here’s what we see',
    error: 'The checker didn’t answer',
  }

  return (
    <div className="backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <div className="d-head">
          <h2 id="dlg-title" ref={headRef} tabIndex={-1}>{titles[phase]}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        {phase === 'choose' && (
          <div className="d-body">
            <p className="muted">{mode === 'where'
              ? 'Take one photo of your work. It’s compared with every step to find where you are.'
              : `Take one photo of your work right now. It’s compared with ${guide.creatorName}’s frame for this step.`}</p>
            <label className="opt">
              <span className="ic"><Icon name="camera" /></span>
              <b>Take or upload a photo</b>
              <span>Opens your camera on a phone</span>
              <input type="file" accept="image/*" capture="environment" onChange={e => pick(e.target.files?.[0])} />
            </label>
            {mode === 'stuck' && (
              <label className="fl">What’s confusing? <span className="muted">(optional)</span>
                <textarea value={question} maxLength={300} onChange={e => setQuestion(e.target.value)} placeholder="e.g. Which way do the holes go?" />
              </label>
            )}
          </div>
        )}

        {phase === 'review' && photo && (
          <>
            <div className="d-body">
              <p>Nothing has been sent yet. Here’s exactly what will go out, and to whom.</p>
              <div className="review">
                <figure className="rv"><div className="im"><img src={photo.url} alt="Your photo" /></div>
                  <figcaption><b>Your photo</b> · {photo.file.name} · {(photo.file.size / 1e6).toFixed(1)} MB</figcaption></figure>
                <figure className="rv"><div className="im">{step.keyframeUrl ? <img src={step.keyframeUrl} alt="" /> : <span className="ph">Creator frame</span>}</div>
                  <figcaption><b>Reference</b> · {mode === 'where' ? 'all step frames' : `${guide.creatorName}’s step ${stepIdx + 1}`}</figcaption></figure>
              </div>
              {question.trim() && <p className="note"><Icon name="mic" /><span><b>Your question:</b> {question.trim()}</span></p>}
              <ul className="recip">
                <li><Icon name="server" /><span><b>Showhow server</b>: passes it on, keeps nothing</span><span className="tag">receives</span></li>
                <li><Icon name="eye" /><span><b>Meta Muse Spark</b>: compares your photo with {mode === 'where' ? 'each step' : `step ${stepIdx + 1}`}</span><span className="tag">processes</span></li>
                <li><Icon name="frame" /><span><b>Meta SAM 3.1</b>: outlines the part that differs</span><span className="tag">processes</span></li>
              </ul>
              <p className="note"><Icon name="shield" /><span>Used only for this check and not stored. A new photo needs a new OK.</span></p>
              <label className="check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I’m 18 or older.</label>
            </div>
            <div className="d-foot">
              <button className="btn btn-ghost" onClick={() => { setPhoto(null); setPhase('choose') }}>Change photo</button>
              <button className="btn btn-primary" onClick={send} disabled={!adult}><Icon name="check" /> Send for check</button>
            </div>
          </>
        )}

        {phase === 'working' && (
          <div className="d-body" aria-live="polite">
            <p className="working"><span className="spin" aria-hidden="true" /> Muse Spark is comparing your photo{mode === 'stuck' ? `, then SAM 3.1 outlines anything that differs` : ' with each step'}. This usually takes a few seconds.</p>
          </div>
        )}

        {phase === 'error' && (
          <>
            <div className="d-body"><p>{errorText || 'Nothing came back, so we won’t guess.'} Your photo wasn’t stored.</p></div>
            <div className="d-foot"><button className="btn btn-ghost" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={() => setPhase('review')}>Try again</button></div>
          </>
        )}

        {phase === 'result' && result && photo && (
          <>
            <div className="d-body">
              {result.fixture && <p className="fixture-tag">TEST FIXTURE · no model was called</p>}
              <div className="verdict">
                <div className="v-photo">
                  <img src={photo.url} alt="Your photo" />
                  {result.mode === 'stuck' && result.verdict.status === 'differs' && result.outline && (
                    <OutlineOverlay outline={result.outline} label={result.verdict.differences[0]?.part ?? 'difference'} />
                  )}
                </div>
                <ResultCard result={result} guide={guide} onGo={idx => { onClose(); onGoToStep(idx) }} />
              </div>
            </div>
            <div className="d-foot">
              <button className="btn btn-ghost" onClick={() => { setPhoto(null); setPhase('choose') }}><Icon name="camera" /> New photo</button>
              <button className="btn btn-primary" onClick={onClose}>Back to the step</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ResultCard({ result, guide, onGo }: { result: CheckResult; guide: Guide; onGo: (idx: number) => void }) {
  if (result.mode === 'where') {
    const s = guide.steps[result.stepIdx]
    return (
      <div className="v-card ok">
        <h3><Icon name="locate" /> You’re on step {result.stepIdx + 1}</h3>
        <p><b>{s?.title}</b></p>
        <p>{result.reason}</p>
        <button className="btn btn-primary" onClick={() => onGo(result.stepIdx)}>Go to step {result.stepIdx + 1} <Icon name="right" /></button>
      </div>
    )
  }
  const { verdict, outline } = result
  if (verdict.status === 'unclear') {
    return <div className="v-card warn"><h3><Icon name="camera" /> Photo unclear</h3><p>{verdict.message}</p><p>Send a closer, well-lit photo of this step.</p></div>
  }
  if (verdict.status === 'match') {
    return <div className="v-card ok"><h3><Icon name="check" /> Looks like the creator’s step</h3><p>{verdict.message}</p></div>
  }
  const pinpointed = !!outline && isValidOutline(outline)
  return (
    <div className="v-card warn">
      <h3><Icon name="alert" /> Something’s different</h3>
      <p>{verdict.message}</p>
      <ul className="checks">{verdict.differences.map(d => <li key={d.part}><Icon name="alert" /><span><b>{d.part}</b>: {d.note}</span></li>)}</ul>
      {!pinpointed && <p className="muted">We couldn’t pinpoint it on your photo, so nothing is outlined.</p>}
    </div>
  )
}
