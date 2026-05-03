// Changed: New flow — profile → client → record → transcribe → generate → review/edit → send → done
//          Added localStorage tradie profile check, quote editor step, history screen
import { useState, useRef, useEffect } from 'react';
import TradieProfileForm from './components/TradieProfileForm.jsx';
import ClientForm from './components/ClientForm.jsx';
import VoiceRecorder from './components/VoiceRecorder.jsx';
import StatusScreen from './components/StatusScreen.jsx';
import QuoteEditor from './components/QuoteEditor.jsx';
import QuoteResult from './components/QuoteResult.jsx';
import QuoteHistory from './components/QuoteHistory.jsx';

// In dev, Vite proxies /api → localhost:3001.
// In production, set VITE_API_URL to your Railway backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

const STEP_LABELS = {
  profile: 'Setup',
  form: 'Step 1 of 4',
  recording: 'Step 2 of 4',
  transcribing: 'Processing',
  generating: 'Processing',
  review: 'Step 3 of 4',
  sending: 'Step 4 of 4',
  done: 'Done',
  error: '',
  history: 'History',
};

function SplashScreen({ fading }) {
  return (
    <div className={`splash-screen${fading ? ' splash-fading' : ''}`}>
      <div className="splash-content">
        <img src="/logo.png" alt="BlueCrewAI" className="splash-logo" />
        <div className="splash-title">Quote Agent</div>
        <div className="splash-sub">by BlueCrewAI</div>
      </div>
      <div className="splash-bar" />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [screen, setScreen] = useState('form');
  const [tradieProfile, setTradieProfile] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteId, setQuoteId] = useState(null);
  const [error, setError] = useState(null);
  const [clientName, setClientName] = useState('');

  // Use refs so handleAudioRecorded closure never captures stale values
  const clientNameRef = useRef('');
  const clientEmailRef = useRef('');

  // Check localStorage for existing tradie profile on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tradieProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        setTradieProfile(profile);
        setScreen('form');
      } else {
        setScreen('profile');
      }
    } catch {
      setScreen('profile');
    }
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1700);
    const hideTimer = setTimeout(() => setShowSplash(false), 2200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  const handleProfileSaved = (profile) => {
    setTradieProfile(profile);
    setScreen('form');
  };

  const handleEditProfile = () => {
    localStorage.removeItem('tradieProfile');
    setTradieProfile(null);
    setScreen('profile');
  };

  const handleFormSubmit = ({ name, email }) => {
    clientNameRef.current = name;
    clientEmailRef.current = email;
    setClientName(name);
    setScreen('recording');
  };

  const handleAudioRecorded = async (audioBlob) => {
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

      // ── Step 2: Generate quote (no email yet) ─────────────────────
      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, tradieProfile }),
      });

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => ({}));
        throw new Error(body.error || 'Quote generation failed');
      }

      const { quote: quoteData, quoteId: id } = await quoteRes.json();
      setQuote(quoteData);
      setQuoteId(id);
      setScreen('review'); // Go to review/edit screen instead of done
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen('error');
    }
  };

  // Typed fallback — skip Whisper, send text directly to generate-quote
  const handleTypedTranscript = async (transcript) => {
    try {
      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, tradieProfile }),
      });

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => ({}));
        throw new Error(body.error || 'Quote generation failed');
      }

      const { quote: quoteData, quoteId: id } = await quoteRes.json();
      setQuote(quoteData);
      setQuoteId(id);
      setScreen('review');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen('error');
    }
  };

  // Send the edited quote via the new /api/send-quote endpoint
  const handleSendQuote = async (editedQuote) => {
    const name = clientNameRef.current;
    const email = clientEmailRef.current;

    try {
      setScreen('sending');

      const sendRes = await fetch(`${API_BASE}/api/send-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteData: editedQuote,
          clientName: name,
          clientEmail: email,
          quoteId,
          tradieProfile,
        }),
      });

      if (!sendRes.ok) {
        const body = await sendRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send quote');
      }

      setQuote(editedQuote);
      setScreen('done');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send. Please try again.');
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
    <>
      {showSplash && <SplashScreen fading={splashFading} />}
      <div className="app">
        <nav className="navbar">
          <img src="/logo.png" alt="BlueCrewAI" style={{ height: '36px' }} />
          <div className="navbar-right">
            <span className="navbar-step">{STEP_LABELS[screen]}</span>
            {tradieProfile && screen !== 'history' && (
              <button className="navbar-history-btn" onClick={() => setScreen('history')}>
                📋
              </button>
            )}
          </div>
        </nav>

        <main className="page">
          {screen === 'profile' && (
            <TradieProfileForm onSave={handleProfileSaved} />
          )}

          {screen === 'form' && (
            <ClientForm
              onSubmit={handleFormSubmit}
              onEditProfile={handleEditProfile}
              tradieProfile={tradieProfile}
            />
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
              variant="transcribing"
              title="Transcribing your voice…"
              subtitle="Sending your recording to Whisper AI. This takes a few seconds."
            />
          )}

          {screen === 'generating' && (
            <StatusScreen
              variant="generating"
              title="Generating your quote…"
              subtitle="Calculating materials, labour & GST..."
            />
          )}

          {screen === 'review' && (
            <QuoteEditor
              quote={quote}
              quoteId={quoteId}
              clientName={clientNameRef.current}
              clientEmail={clientEmailRef.current}
              onSend={handleSendQuote}
              onBack={() => setScreen('recording')}
            />
          )}

          {screen === 'sending' && (
            <StatusScreen
              variant="generating"
              title="Sending quote…"
              subtitle="Generating PDF and emailing to your client."
            />
          )}

          {screen === 'done' && (
            <QuoteResult
              quote={quote}
              quoteId={quoteId}
              clientName={clientName}
              clientEmail={clientEmailRef.current}
              onNewQuote={handleReset}
            />
          )}

          {screen === 'history' && (
            <QuoteHistory
              businessName={tradieProfile?.businessName}
              apiBase={API_BASE}
              onBack={handleReset}
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
    </>
  );
}
