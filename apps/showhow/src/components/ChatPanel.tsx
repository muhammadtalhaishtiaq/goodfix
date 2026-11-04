import { useEffect, useRef, useState, type FormEvent } from 'react'
import { NOT_COVERED, replyText, type ChatMsg, type ChatReply } from '../lib/chat'
import { chatStep, listenQuestion } from '../lib/data'
import { Icon } from './Icon'
import './chat.css'

// Step chat + voice agent (2026-11-03). The conversation lives only in this tab: nothing is stored on our
// side, so a refresh clears it. Copy / Save let the learner keep it. Keyed by guide, so it carries across steps.
type Entry = { kind: 'user'; text: string } | { kind: 'bot'; reply: ChatReply } | { kind: 'step'; idx: number }
type Busy = 'idle' | 'thinking' | 'listening' | 'hearing' | 'speaking'

export function ChatPanel({ guideId, guideTitle, stepIdx }: { guideId: string; guideTitle: string; stepIdx: number }) {
  const [log, setLog] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<Busy>('idle')
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null)
  const [talk, setTalk] = useState(false) // talk mode: answers are read aloud, then it listens again
  const [copied, setCopied] = useState(false)
  const logRef = useRef<HTMLOListElement>(null)
  const stepSeen = useRef(stepIdx)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const talkRef = useRef(talk) // read when an answer finishes playing, after renders
  useEffect(() => { talkRef.current = talk }, [talk])
  const mic = useMic()

  // Moving to another step keeps the conversation and marks where the learner moved.
  useEffect(() => {
    if (stepSeen.current === stepIdx) return
    stepSeen.current = stepIdx
    setLog(l => (l.length && l[l.length - 1].kind !== 'step' ? [...l, { kind: 'step', idx: stepIdx }] : l))
  }, [stepIdx])
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight }, [log, busy])
  useEffect(() => () => { audioRef.current?.pause(); mic.cancel() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const history = (entries: Entry[]): ChatMsg[] => entries.flatMap((e): ChatMsg[] =>
    e.kind === 'user' ? [{ role: 'user', text: e.text }] : e.kind === 'bot' ? [{ role: 'assistant', text: replyText(e.reply) }] : []).slice(-12)

  async function send(q: string, speak = talk) {
    const question = q.trim().slice(0, 400)
    if (!question || busy === 'thinking') return
    const next: Entry[] = [...log, { kind: 'user', text: question }]
    setLog(next)
    setText('')
    setError(null)
    setBusy('thinking')
    try {
      const { audio, ...reply } = await chatStep(guideId, stepIdx, history(next), speak)
      setLog(l => [...l, { kind: 'bot', reply }])
      if (audio) return play(audio)
      setBusy('idle')
    } catch (e) {
      setBusy('idle')
      setLog(l => l.slice(0, -1)) // take the question back so Try again resends it once
      setError({ message: (e as Error).message || 'Something went wrong. Please try again.', retry: () => send(question, speak) })
    }
  }

  function play(b64: string) {
    setBusy('speaking')
    const a = new Audio(`data:audio/mpeg;base64,${b64}`)
    audioRef.current = a
    const done = () => { setBusy('idle'); if (talkRef.current) void listen() }
    a.onended = done
    a.onerror = () => setBusy('idle')
    a.play().catch(() => setBusy('idle'))
  }

  async function listen() {
    audioRef.current?.pause()
    setError(null)
    setBusy('listening')
    try {
      const wav = await mic.record(() => setBusy('hearing'))
      if (!wav) return setBusy('idle') // cancelled, or nothing was said
      setBusy('thinking')
      const q = await listenQuestion(guideId, wav)
      setBusy('idle')
      await send(q, true)
    } catch (e) {
      setBusy('idle')
      setError({ message: (e as Error).message || 'We couldn’t use the microphone.', retry: () => void listen() })
    }
  }

  function stopVoice() {
    mic.stop()
    audioRef.current?.pause()
    if (busy === 'speaking') setBusy('idle')
  }

  const transcript = () => [`Showhow chat · “${guideTitle}”`, `Saved ${new Date().toLocaleString()}`, '', ...log.map(e =>
    e.kind === 'user' ? `You: ${e.text}` : e.kind === 'step' ? `— now on step ${e.idx + 1} —` : `Showhow: ${replyText(e.reply)}${e.reply.covered && e.reply.steps.length ? ` (from step ${e.reply.steps.map(s => s + 1).join(', ')})` : ''}`)].join('\n')
  function copy() { navigator.clipboard?.writeText(transcript()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }, () => {}) }
  function save() {
    const url = URL.createObjectURL(new Blob([transcript()], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `showhow-chat-${guideTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.txt` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const voiceOn = busy === 'listening' || busy === 'hearing' || busy === 'speaking'
  const status = { idle: '', thinking: '', listening: 'Listening… start talking', hearing: 'Listening… stops when you pause', speaking: 'Speaking…' }[busy]
  function submit(e: FormEvent) { e.preventDefault(); void send(text) }

  return (
    <section className="chat">
      <div className="chat-head">
        <h3>Chat about this guide</h3>
        <span className="chat-mono">Step {stepIdx + 1}</span>
      </div>
      <ol className="chat-log" ref={logRef} aria-live="polite">
        {!log.length && <li className="chat-empty">Ask anything about this step, by typing or talking. Answers come from the creator’s guide; anything extra is marked as an AI suggestion.</li>}
        {log.map((e, i) => e.kind === 'user'
          ? <li key={i} className="chat-me"><span className="sr">You: </span>{e.text}</li>
          : e.kind === 'step'
            ? <li key={i} className="chat-step">Now on step {e.idx + 1}</li>
            : <li key={i} className="chat-bot"><Reply r={e.reply} fixture={guideId.startsWith('fixture-')} /></li>)}
        {busy === 'thinking' && <li className="chat-bot chat-wait"><span className="spin" aria-hidden="true" /> Thinking…</li>}
      </ol>
      {error && <div className="chat-error" role="alert"><p>{error.message}</p><button type="button" className="chat-btn chat-btn-line" onClick={error.retry}>Try again</button></div>}
      <form className="chat-form" onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} maxLength={400} placeholder="Type a question" aria-label="Your question" disabled={voiceOn} />
        {voiceOn
          ? <button type="button" className="chat-btn chat-btn-signal" onClick={stopVoice} aria-label="Stop"><Icon name="pause" /></button>
          : <button type="button" className="chat-btn chat-btn-line" onClick={() => void listen()} aria-label="Ask by voice" disabled={busy === 'thinking'}><Icon name="mic" /></button>}
        <button type="submit" className="chat-btn" disabled={!text.trim() || busy !== 'idle'}>Send</button>
      </form>
      <div className="chat-tools">
        <label className="chat-talk" title="Reads answers aloud, then listens for your next question"><input type="checkbox" checked={talk} onChange={e => setTalk(e.target.checked)} /> Talk mode</label>
        {status && <span className="chat-mono" aria-live="polite">{status}</span>}
        {log.length > 0 && <span className="chat-keep"><button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button><button type="button" onClick={save}>Save as text</button></span>}
      </div>
      <p className="chat-note">Nothing is saved: the chat is gone when you refresh (use Copy or Save). Questions go to Meta with storage off. 18+.</p>
    </section>
  )
}

function Reply({ r, fixture }: { r: ChatReply; fixture: boolean }) {
  return (
    <>
      {r.covered
        ? <><span className="chat-mono">From the creator{r.steps.length ? ` · step ${r.steps.map(s => s + 1).join(', ')}` : ''}</span><p>{r.answer}</p></>
        : <><span className="chat-mono">Not in this guide</span><p>{fixture ? 'TEST FIXTURE: no model was called.' : NOT_COVERED}</p></>}
      {r.tip && !fixture && <div className="chat-tip"><span className="chat-mono">AI suggestion · not from the creator</span><p>{r.tip}</p></div>}
    </>
  )
}

// Microphone → 16 kHz WAV. Stops by itself ~1.3 s after the learner stops talking (or at 30 s).
function useMic() {
  const stopRef = useRef<(() => void) | null>(null)
  const cancelled = useRef(false)
  return {
    stop: () => stopRef.current?.(),
    cancel: () => { cancelled.current = true; stopRef.current?.() },
    record: async (onSpeech: () => void): Promise<Blob | null> => {
      cancelled.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => { throw new Error('Microphone access was blocked. Allow it in the browser, or type your question.') })
      const ctx = new AudioContext()
      const an = ctx.createAnalyser()
      an.fftSize = 2048
      ctx.createMediaStreamSource(stream).connect(an)
      const rec = new MediaRecorder(stream)
      const chunks: Blob[] = []
      rec.ondataavailable = e => chunks.push(e.data)
      const buf = new Float32Array(an.fftSize)
      let heard = 0, quietSince = 0
      const t0 = performance.now()
      const done = new Promise<void>(ok => { rec.onstop = () => ok() })
      const tick = window.setInterval(() => {
        an.getFloatTimeDomainData(buf)
        const rms = Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length)
        const now = performance.now()
        if (rms > 0.02) { if (!heard) onSpeech(); heard = heard || now; quietSince = 0 } else if (heard && !quietSince) quietSince = now
        if ((heard && quietSince && now - quietSince > 1300) || now - t0 > 30_000 || (!heard && now - t0 > 8000)) stopRef.current?.()
      }, 100)
      stopRef.current = () => { if (rec.state === 'recording') rec.stop() }
      rec.start()
      await done
      clearInterval(tick)
      stream.getTracks().forEach(t => t.stop())
      void ctx.close()
      stopRef.current = null
      if (cancelled.current || !heard) return null
      const { toWav16k } = await import('../lib/shrink')
      return (await toWav16k(new Blob(chunks, { type: rec.mimeType }))).wav
    },
  }
}
