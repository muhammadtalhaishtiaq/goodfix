export function PrivacyView() {
  return (
    <div className="narrow prose">
      <a className="back" href="#/">← All guides</a>
      <h1>Privacy and how it works</h1>
      <p className="sub">Showhow is a hackathon prototype. Here is exactly what happens to what you share.</p>
      <h2>If you’re stuck and send a photo</h2>
      <ul>
        <li>You see exactly what will be sent before anything leaves your device, and you approve each photo.</li>
        <li>The photo is shrunk on your device, sent once to our server and on to Meta’s Muse Spark and SAM 3.1 to compare it with the creator’s step.</li>
        <li><b>It is not stored</b> by us, and we ask Meta not to keep it (<code>store: false</code>). It is not logged.</li>
      </ul>
      <h2>If you create a guide from a video</h2>
      <ul>
        <li>Your original video never leaves your device; a smaller 720p copy is uploaded.</li>
        <li>The video and one still per step are stored and become <b>public</b> when you publish. The audio copy is deleted once it has been transcribed.</li>
        <li>Meta’s Voice Transcribe, Muse Spark, SAM 3.1 (and Muse Image if you ask for enhanced stills) process it. Unpublished drafts are deleted after 24 hours.</li>
      </ul>
      <h2>If you talk a guide through</h2>
      <ul>
        <li>The recording is checked in memory and <b>never stored</b>. If it doesn’t pass the safety check, nothing is kept at all.</li>
        <li>If it passes, the steps (your words) and AI illustrations are stored and public once you publish. Illustrations are always labelled “Illustration by AI”.</li>
      </ul>
      <h2>What we check before anything is published</h2>
      <ol>
        <li>Spoken words are turned into text (Meta Voice Transcribe).</li>
        <li>Hard topic rules in our own code block weapons, violence, self-harm, drugs, gas or mains-electrical work, fire, medical procedures, vehicle brakes, hacking, illegal acts, adult content, hate or harassment, and personal details (phone numbers, emails, card numbers).</li>
        <li>Meta Muse Spark reviews whether it is suitable for a public audience and is really a how-to. If this check can’t run, nothing is published.</li>
        <li>For videos, one still per step is also checked for anything unsuitable to publish.</li>
        <li>The creator reviews every step before publishing. AI can be wrong; a guide is never labelled “verified” or “safe”.</li>
      </ol>
      <h2>Always</h2>
      <ul>
        <li>For adults (18+). No accounts, no analytics, no ads, no tracking cookies.</li>
        <li>We keep only a salted hash of your IP address inside a daily counter, to limit abuse. Logs contain no photos, words or keys.</li>
        <li>AI can be wrong. A “match” only means your photo looks like the creator’s step; it is never safety advice.</li>
      </ul>
    </div>
  )
}
