# TradeOS — Quote Generator

Voice-first quote generation for Australian tradies.
Speak → Whisper transcribes → Claude generates itemised quote → PDF emailed to client.

## How it works

1. Tradie opens the app and enters client name + email
2. Holds the mic button and describes the job out loud
3. Audio is sent to OpenAI Whisper → transcript
4. Transcript is sent to Claude → itemised quote with AUD pricing + 10% GST
5. A branded PDF is generated and emailed directly to the client
6. Tradie sees the quote summary on screen — done

## Prerequisites

- Node.js 20+
- API keys for: OpenAI, Anthropic, Resend
- A verified sending domain in Resend (or use their sandbox for testing)

## Setup

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Copy the example env file
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

### 3. Run locally

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

### 4. Test the flow

1. Enter a client name and email
2. Hold the mic button and say something like:
   > "400 square metre lawn needs mowing and edging, three garden beds mulched, and there's a dead medium-sized tree that needs removing. Job is in Penrith NSW."
3. Release — the app transcribes, generates a quote, and emails the PDF

## Project structure

```
tradeos-quote-agent/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── routes/quote.js        # POST /api/transcribe + /api/generate-quote
│   │   └── services/
│   │       ├── whisper.js         # OpenAI Whisper transcription
│   │       ├── claude.js          # Claude quote generation (with prompt caching)
│   │       ├── pdf.js             # Puppeteer PDF generation
│   │       └── email.js           # Resend email delivery
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # State machine (form → record → process → done)
│   │   ├── index.css              # Mobile-first styles, orange brand
│   │   └── components/
│   │       ├── ClientForm.jsx     # Client name + email
│   │       ├── VoiceRecorder.jsx  # Hold-to-record mic button
│   │       ├── StatusScreen.jsx   # Loading states
│   │       └── QuoteResult.jsx    # Quote summary + "New Quote"
│   ├── vite.config.js
│   └── package.json
└── .env.example
```

## API endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/api/transcribe` | `multipart/form-data` — field `audio` | `{ transcript }` |
| `POST` | `/api/generate-quote` | `{ transcript, clientName, clientEmail }` | `{ success, quote, quoteId }` |
| `GET` | `/api/health` | — | `{ status: "ok" }` |

## Deploy

### Backend → Railway

1. Create a new Railway project, connect this repo, set root to `backend/`
2. Add all env vars from `backend/.env` in Railway's Variables tab
3. Railway auto-detects Node and runs `npm start`
4. Copy the Railway public URL (e.g. `https://tradeos-backend.up.railway.app`)

### Frontend → Vercel

1. Create a new Vercel project, connect this repo, set root to `frontend/`
2. Add env var: `VITE_API_URL=https://your-railway-url.up.railway.app`
3. Vercel auto-detects Vite and builds/deploys

## Resend email setup

For production, verify your domain at resend.com/domains and update `FROM_EMAIL` in your env.

For local testing, use `onboarding@resend.dev` as `FROM_EMAIL` — Resend sends test emails to your Resend account email only.

## Coming next (not built yet)

- Auth with Clerk (login / per-tradie accounts)
- Save quotes to Supabase (quote history)
- Stripe subscription (monthly SaaS billing)
