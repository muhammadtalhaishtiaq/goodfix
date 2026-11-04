import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Judge link (2026-11-03): /?code=…#/create fills the access code for this tab, then drops it from the address bar.
const linkCode = new URLSearchParams(location.search).get('code')
if (linkCode) {
  try { sessionStorage.setItem('showhow.accessCode', linkCode.slice(0, 200)) } catch { /* private mode: type it instead */ }
  history.replaceState(null, '', location.pathname + location.hash)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
