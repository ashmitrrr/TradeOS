# TradeOS — Quote Generator

Voice-first quote generation for Australian tradies.
Speak → Whisper transcribes → Claude generates itemised quote → Review & edit → PDF emailed to client.

## How it works

1. Tradie sets up their profile (business name, trade, rates) — once only
2. Enters client name + email for each new quote
3. Holds the mic button and describes the job out loud
4. Audio is sent to OpenAI Whisper → transcript
5. Transcript + tradie profile sent to Claude → itemised quote with AUD pricing + 10% GST
6. Tradie reviews and edits line items, adds/removes rows
7. Hits "Send Quote" → branded PDF generated and emailed to the client
8. Quote saved to Supabase for history

## Prerequisites

- Node.js 20+
- API keys for: OpenAI, Anthropic, Resend
- A verified sending domain in Resend (or use their sandbox for testing)
- (Optional) Supabase project for quote history

## Setup

### 1. Clone and install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp .env.example backend/.env
# Edit backend/.env and fill in your real API keys
```

Required keys:

| Key | Where to get it |
|-----|----------------|
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys |
| `RESEND_API_KEY` | resend.com/api-keys |
| `FROM_EMAIL` | A domain verified in Resend |
| `BUSINESS_NAME` | Your business name (printed on quotes) |
| `SUPABASE_URL` | supabase.com → Settings → API |
| `SUPABASE_KEY` | supabase.com → Settings → API (anon key) |

### 3. Supabase Setup (Optional — for quote history)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL editor:

```sql
CREATE TABLE quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number text,
  client_name text,
  client_email text,
  business_name text,
  items jsonb,
  subtotal numeric,
  gst numeric,
  total numeric,
  created_at timestamptz DEFAULT now()
);
```

3. Copy URL and anon key from Settings → API into your `.env`

> If you skip Supabase, everything still works — quotes just won't be saved to history.

### 4. Run locally

Open two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 on your phone or browser.

### 5. Test the flow

1. Set up your tradie profile (first time only)
2. Enter a client name and email
3. Hold the mic button and say something like:
   > "400 square metre lawn needs mowing and edging, three garden beds mulched, and there's a dead medium-sized tree that needs removing. Job is in Penrith NSW."
4. Review the generated quote — edit any line items
5. Hit "Send Quote" — PDF is emailed to the client

## Project structure

```
tradeos-quote-agent/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── routes/quote.js        # /api/transcribe, /api/generate-quote, /api/send-quote, /api/quotes
│   │   └── services/
│   │       ├── whisper.js         # OpenAI Whisper transcription
│   │       ├── claude.js          # Claude quote generation (with tradie profile + prompt caching)
│   │       ├── pdf.js             # Puppeteer PDF generation (logo, brand, payment terms)
│   │       ├── email.js           # Resend email delivery
│   │       └── supabase.js        # Supabase quote history storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # State machine (profile → form → record → generate → review → send → done)
│   │   ├── index.css              # Mobile-first styles, BlueCrewAI branding
│   │   └── components/
│   │       ├── TradieProfileForm.jsx  # One-time business profile setup
│   │       ├── ClientForm.jsx         # Client name + email per quote
│   │       ├── VoiceRecorder.jsx      # Hold-to-record mic button
│   │       ├── StatusScreen.jsx       # Loading states
│   │       ├── QuoteEditor.jsx        # Edit line items before sending
│   │       ├── QuoteResult.jsx        # Quote sent confirmation
│   │       └── QuoteHistory.jsx       # Past quotes list + detail view
│   ├── vite.config.js
│   └── package.json
└── .env.example
```

## API endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/api/transcribe` | `multipart/form-data` — field `audio` | `{ transcript }` |
| `POST` | `/api/generate-quote` | `{ transcript, tradieProfile }` | `{ success, quote, quoteId }` |
| `POST` | `/api/send-quote` | `{ quoteData, clientName, clientEmail, quoteId, tradieProfile }` | `{ success, quoteId }` |
| `GET` | `/api/quotes` | `?businessName=XYZ` | `{ quotes: [...] }` |
| `GET` | `/api/health` | — | `{ status: "ok" }` |

## Deploy

### Backend → Railway

1. Create a new Railway project, connect this repo, set root to `backend/`
2. Add all env vars from `backend/.env` in Railway's Variables tab
3. Railway auto-detects Node and runs `npm start`
4. Copy the Railway public URL

### Frontend → Vercel

1. Create a new Vercel project, connect this repo, set root to `frontend/`
2. Add env var: `VITE_API_URL=https://your-railway-url.up.railway.app`
3. Vercel auto-detects Vite and builds/deploys

## Coming next (not built yet)

- Auth with Clerk (login / per-tradie accounts)
- Stripe subscription (monthly SaaS billing)
- Client can view/accept quote online
- Quote templates (save favourite job types)
