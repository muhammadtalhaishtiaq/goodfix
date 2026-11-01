import { useEffect, useState } from 'react'
import { CreateView } from './app/CreateView'
import { GalleryView } from './app/GalleryView'
import { GuideView } from './app/GuideView'
import { VoiceCreate } from './app/VoiceCreate'
import { Icon } from './components/Icon'
import { fetchGuide } from './lib/data'
import type { Guide } from './lib/types'

// Hash routes: #/ · #/guide/:id/:step (1-based) · #/create · #/create/voice
function parseHash(hash: string) {
  const [, view, id, step] = hash.split('/')
  return { view: view ?? '', id: id ?? '', step: Math.max(1, Number.parseInt(step ?? '1', 10) || 1) - 1 }
}

export function App() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onHash = () => { setHash(location.hash); scrollTo({ top: 0 }) }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const route = parseHash(hash)

  return (
    <>
      <header className="top">
        <div className="top-in">
          <a className="logo" href="#/">
            <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#1F5A4C" /><rect x="7" y="8" width="18" height="14" rx="3" fill="none" stroke="#F5F0E6" strokeWidth="2.4" /><path d="M11.5 15.5l3 3 6-6.5" fill="none" stroke="#EE5A17" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 25.5h8" stroke="#F5F0E6" strokeWidth="2.4" strokeLinecap="round" /></svg>
            Showhow
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#/" aria-current={route.view === '' ? 'page' : undefined}>Gallery</a>
            <a className="btn btn-primary" href="#/create"><Icon name="plus" /><span className="lbl-sm">Create guide</span></a>
          </nav>
        </div>
      </header>
      <main>
        {route.view === 'guide' ? <GuideLoader id={route.id} step={route.step} />
          : route.view === 'create' ? (route.id === 'voice' ? <VoiceCreate /> : <CreateView />)
          : <GalleryView />}
      </main>
    </>
  )
}

function GuideLoader({ id, step }: { id: string; step: number }) {
  const [state, setState] = useState<{ id: string; guide?: Guide; error?: string } | null>(null)
  useEffect(() => {
    let live = true
    fetchGuide(id).then(guide => { if (live) setState({ id, guide }) }, e => { if (live) setState({ id, error: (e as Error).message }) })
    return () => { live = false }
  }, [id])
  if (!state || state.id !== id) return <p className="working"><span className="spin" aria-hidden="true" /> Loading guide…</p>
  if (!state.guide) return <p className="empty">{state.error ?? 'This guide doesn’t exist or isn’t published.'} <a href="#/">Back to the gallery</a></p>
  return <GuideView key={id} guide={state.guide} stepIdx={Math.min(step, state.guide.steps.length - 1)} />
}

export default App
