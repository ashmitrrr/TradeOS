import { useState, useRef } from 'react';
import ClientForm from './components/ClientForm.jsx';
import VoiceRecorder from './components/VoiceRecorder.jsx';
import StatusScreen from './components/StatusScreen.jsx';
import QuoteResult from './components/QuoteResult.jsx';

// In dev, Vite proxies /api → localhost:3001.
// In production, set VITE_API_URL to your Railway backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

const STEP_LABELS = {
  form: 'Step 1 of 3',
  recording: 'Step 2 of 3',
  transcribing: 'Working…',
  generating: 'Working…',
  done: 'Done',
  error: '',
};

export default function App() {
  const [screen, setScreen] = useState('form');
  const [quote, setQuote] = useState(null);
  const [quoteId, setQuoteId] = useState(null);
  const [error, setError] = useState(null);
  const [clientName, setClientName] = useState('');

  // Use refs so handleAudioRecorded closure never captures stale values
  const clientNameRef = useRef('');
  const clientEmailRef = useRef('');

  const handleFormSubmit = ({ name, email }) => {
    clientNameRef.current = name;
    clientEmailRef.current = email;
    setClientName(name);
    setScreen('recording');
  };

  const handleAudioRecorded = async (audioBlob) => {
    const name = clientNameRef.current;
    const email = clientEmailRef.current;

    try {
      // ── Step 1: Transcribe ──────────────────────────────────────
      setScreen('transcribing');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}));
        throw new Error(body.error || 'Transcription failed');
      }

      const { transcript } = await transcribeRes.json();

      // ── Step 2: Generate quote + send email ─────────────────────
      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, clientName: name, clientEmail: email }),
      });

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => ({}));
        throw new Error(body.error || 'Quote generation failed');
      }

      const { quote: quoteData, quoteId: id } = await quoteRes.json();
      setQuote(quoteData);
      setQuoteId(id);
      setScreen('done');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen('error');
    }
  };

  // Typed fallback — skip Whisper, send text directly to generate-quote
  const handleTypedTranscript = async (transcript) => {
    const name = clientNameRef.current;
    const email = clientEmailRef.current;

    try {
      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, clientName: name, clientEmail: email }),
      });

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => ({}));
        throw new Error(body.error || 'Quote generation failed');
      }

      const { quote: quoteData, quoteId: id } = await quoteRes.json();
      setQuote(quoteData);
      setQuoteId(id);
      setScreen('done');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen('error');
    }
  };

  const handleReset = () => {
    setScreen('form');
    setQuote(null);
    setQuoteId(null);
    setError(null);
    setClientName('');
    clientNameRef.current = '';
    clientEmailRef.current = '';
  };

  return (
    <div className="app">
      <nav className="navbar">
        <span className="navbar-brand">TradeOS</span>
        <span className="navbar-step">{STEP_LABELS[screen]}</span>
      </nav>

      <main className="page">
        {screen === 'form' && (
          <ClientForm onSubmit={handleFormSubmit} />
        )}

        {screen === 'recording' && (
          <VoiceRecorder
            clientName={clientName}
            onRecorded={handleAudioRecorded}
            onTyped={handleTypedTranscript}
            onBack={() => setScreen('form')}
          />
        )}

        {screen === 'transcribing' && (
          <StatusScreen
            title="Transcribing your voice…"
            subtitle="Sending your recording to Whisper AI. This takes a few seconds."
          />
        )}

        {screen === 'generating' && (
          <StatusScreen
            title="Generating your quote…"
            subtitle="Claude AI is building your itemised quote and emailing it to your client."
          />
        )}

        {screen === 'done' && (
          <QuoteResult
            quote={quote}
            quoteId={quoteId}
            clientName={clientName}
            onNewQuote={handleReset}
          />
        )}

        {screen === 'error' && (
          <div style={{ paddingTop: '20px' }}>
            <h1>Something went wrong</h1>
            <p className="subheading" style={{ marginTop: '8px' }}>
              Don't worry — no charge was made.
            </p>
            <div className="error-box" style={{ marginTop: '20px' }}>
              {error}
            </div>
            <button className="btn btn-primary" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
