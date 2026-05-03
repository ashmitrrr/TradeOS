// Changed: Added Supabase Auth gating — user must sign in before using the app.
//          Session managed via onAuthStateChange listener. Token passed to API calls.
//          Profile loaded from Supabase (via API) instead of localStorage.
import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase.js';
import AuthScreen from './components/AuthScreen.jsx';
import TradieProfileForm from './components/TradieProfileForm.jsx';
import ClientForm from './components/ClientForm.jsx';
import VoiceRecorder from './components/VoiceRecorder.jsx';
import StatusScreen from './components/StatusScreen.jsx';
import QuoteEditor from './components/QuoteEditor.jsx';
import QuoteResult from './components/QuoteResult.jsx';
import QuoteHistory from './components/QuoteHistory.jsx';

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

  // Auth state
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [screen, setScreen] = useState('form');
  const [tradieProfile, setTradieProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteId, setQuoteId] = useState(null);
  const [error, setError] = useState(null);
  const [clientName, setClientName] = useState('');

  const clientNameRef = useRef('');
  const clientEmailRef = useRef('');

  // Helper: get auth headers for API calls
  const getAuthHeaders = () => {
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Splash screen timer ──
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1700);
    const hideTimer = setTimeout(() => setShowSplash(false), 2200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // ── Auth: listen for session changes ──
  useEffect(() => {
    // If Supabase not configured, skip auth (dev mode)
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      setSession({ access_token: 'dev-token', user: { id: 'dev', email: 'dev@localhost' } });
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load profile from API when session becomes available ──
  useEffect(() => {
    if (!session) {
      setTradieProfile(null);
      return;
    }

    setProfileLoading(true);
    fetch(`${API_BASE}/api/profile`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && data.profile.business_name) {
          // Convert DB column names to camelCase for frontend
          setTradieProfile({
            businessName: data.profile.business_name,
            trade: data.profile.trade,
            labourRate: data.profile.labour_rate,
            calloutFee: data.profile.callout_fee || 0,
            paymentTerms: data.profile.payment_terms || '14 days',
            logoBase64: data.profile.logo_base64 || null,
          });
          setScreen('form');
        } else {
          // Profile exists but not filled out — show setup
          setScreen('profile');
        }
      })
      .catch(() => setScreen('profile'))
      .finally(() => setProfileLoading(false));
  }, [session?.access_token]);

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setTradieProfile(null);
    setScreen('form');
    setQuote(null);
    setQuoteId(null);
  };

  const handleProfileSaved = (profile) => {
    setTradieProfile(profile);
    setScreen('form');
  };

  const handleEditProfile = () => {
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
      setScreen('transcribing');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}));
        throw new Error(body.error || 'Transcription failed');
      }

      const { transcript } = await transcribeRes.json();

      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  const handleTypedTranscript = async (transcript) => {
    try {
      setScreen('generating');

      const quoteRes = await fetch(`${API_BASE}/api/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  const handleSendQuote = async (editedQuote) => {
    const name = clientNameRef.current;
    const email = clientEmailRef.current;

    try {
      setScreen('sending');

      const sendRes = await fetch(`${API_BASE}/api/send-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  // ── Show splash + loading ──
  if (showSplash) return <SplashScreen fading={splashFading} />;

  // ── Auth loading ──
  if (authLoading) {
    return (
      <div className="app">
        <div className="status-screen">
          <div className="spinner-dark" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated — show login ──
  if (!session) {
    return <AuthScreen />;
  }

  // ── Profile loading ──
  if (profileLoading) {
    return (
      <div className="app">
        <div className="status-screen">
          <div className="spinner-dark" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Authenticated — show app ──
  return (
    <div className="app">
      <nav className="navbar">
        <img src="/logo.png" alt="BlueCrewAI" style={{ height: '36px' }} />
        <div className="navbar-right">
          <span className="navbar-step">{STEP_LABELS[screen]}</span>
          {tradieProfile && screen !== 'history' && (
            <button className="navbar-history-btn" onClick={() => setScreen('history')} title="Quote History">
              📋
            </button>
          )}
          <button className="navbar-signout-btn" onClick={handleSignOut} title="Sign out">
            ↪
          </button>
        </div>
      </nav>

      <main className="page">
        {screen === 'profile' && (
          <TradieProfileForm
            onSave={handleProfileSaved}
            session={session}
            apiBase={API_BASE}
            existingProfile={tradieProfile}
          />
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
            session={session}
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
  );
}
