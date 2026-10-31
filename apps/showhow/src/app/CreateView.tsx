import { Icon } from '../components/Icon'

// Placeholder until T8–T11 build the real pipeline. Says so plainly rather than faking it.
export function CreateView() {
  return (
    <div className="c-wrap">
      <a className="back" href="#/"><Icon name="back" /> Gallery</a>
      <h1>Turn your video into a guide</h1>
      <p className="lead">Film yourself doing it once, talking as you go. Showhow cuts it into steps, outlines the key part in each, and lets anyone check their work against yours.</p>
      <div className="panel">
        <p className="note"><Icon name="alert" /><span>Guide creation isn’t connected yet. It needs the upload and model pipeline (in progress).</span></p>
      </div>
    </div>
  )
}
