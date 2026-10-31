import { useEffect, useState } from 'react'
import { CreateView } from './app/CreateView'
import { GalleryView } from './app/GalleryView'
import { GuideView } from './app/GuideView'
import { Icon } from './components/Icon'
import { getGuide } from './lib/data'

// Hash routes: #/ · #/guide/:id/:step (1-based) · #/create
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
  const guide = route.view === 'guide' ? getGuide(route.id) : undefined

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
        {guide ? <GuideView key={guide.id} guide={guide} stepIdx={Math.min(route.step, guide.steps.length - 1)} />
          : route.view === 'create' ? <CreateView />
          : <GalleryView />}
      </main>
    </>
  )
}

export default App
