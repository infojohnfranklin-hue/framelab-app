
import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn } = useUser();

  const [artist, setArtist] = useState('Velvet Mirage');
  const [track, setTrack] = useState('After Midnight');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ref = useRef(null);

  async function generate() {
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artist,
          trackName: track,
          genre: 'Melodic House',
          bpm: 122,
          mood: 'luxury sunset',
          visualStyle: 'Miami Afterdark'
        })
      });

      const data = await res.json();

      setResult(data);

      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      paddingLeft: '260px',
      background: 'radial-gradient(circle at top left, #3b1d5c 0%, #0b0b12 40%)',
      color: 'white',
      fontFamily: 'Arial'
    }}>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 60 }}>

        <div style={{ color: '#b985ff', fontSize: 12, letterSpacing: 2 }}>
          CINEMATIC AI REEL GENERATOR
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 800 }}>
          Create premium cinematic reels
        </h1>

        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder='Artist'
          style={{ padding: 12, marginTop: 20, width: '100%' }}
        />

        <input
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          placeholder='Track'
          style={{ padding: 12, marginTop: 10, width: '100%' }}
        />

        <button
          onClick={generate}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: 14,
            background: '#b985ff',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Reel'}
        </button>

        {result && (
          <div ref={ref} style={{ marginTop: 40, padding: 20, background: 'rgba(255,255,255,0.05)' }}>
            <h2>{artist} — {track}</h2>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </main>
  );
}
