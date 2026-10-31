import './App.css'

export function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Showhow home">
          <span className="brand-mark" aria-hidden="true">s</span>
          <span>showhow</span>
        </a>
        <span className="mode-badge"><span aria-hidden="true" /> Local preview</span>
      </header>

      <section className="welcome-card" id="home" aria-labelledby="welcome-title">
        <p className="eyebrow">A small fix, made clearer</p>
        <h1 id="welcome-title">Let’s figure out<br />one next step.</h1>
        <p className="intro">
          Follow a guide one step at a time. When you get stuck, Showhow
          will check a photo of your work against the creator's.
        </p>

        <div className="start-panel">
          <div className="upload-mark" aria-hidden="true">＋</div>
          <div>
            <h2>Show the problem</h2>
            <p>The upload and model flow are not connected yet.</p>
          </div>
          <button type="button" disabled aria-describedby="local-note">
            Choose a photo or video
          </button>
        </div>

        <p className="privacy-note" id="local-note">
          <span aria-hidden="true">●</span>
          This foundation build makes no network requests and sends no files.
        </p>
      </section>

      <footer className="page-footer">
        Showhow foundation build. The full app is being built from the prototype.
      </footer>
    </main>
  )
}

export default App
