import { useEffect, useState } from 'react'
import { CreateView } from './app/CreateView'
import { GalleryView } from './app/GalleryView'
import { GuideView } from './app/GuideView'
import { PrivacyView } from './app/PrivacyView'
import { VoiceCreate } from './app/VoiceCreate'
import { fetchGuide } from './lib/data'
import type { Guide } from './lib/types'

// Hash routes: #/ · #/guide/:id/:step (1-based) · #/create · #/create/voice · #/privacy
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
          <a className="logo" href="#/"><i aria-hidden="true" />Showhow</a>
          <nav className="tabs" aria-label="Main">
            <a className="tab" href="#/" aria-current={route.view === '' ? 'page' : undefined}>Guides</a>
            <a className="tab" href="#/create" aria-current={route.view === 'create' ? 'page' : undefined}>Create</a>
          </nav>
        </div>
      </header>
      <main>
        {route.view === 'guide' ? <GuideLoader id={route.id} step={route.step} />
          : route.view === 'create' ? (route.id === 'voice' ? <VoiceCreate /> : <CreateView />)
          : route.view === 'privacy' ? <PrivacyView />
          : <GalleryView />}
      </main>
      <footer className="foot">
        <span>Showhow · hackathon prototype</span>
        <a href="#/privacy" aria-current={route.view === 'privacy' ? 'page' : undefined}>Privacy and how it works</a>
      </footer>
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
