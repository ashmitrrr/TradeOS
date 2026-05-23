# BlueCrewAI — Claude Code Master Prompt
> Drop this into any Claude Code session for instant full context.
> Or rename this file CLAUDE.md in your project root and Claude Code reads it automatically.

---

## Who we are

BlueCrewAI is an AI automation firm for Australian trades and construction businesses, based in Sydney. We build AI agents and automation systems for solo tradies AND mid-size trade firms (electrical, plumbing, construction, landscaping, roofing).

**CEO:** Ashmit
**Stage:** Pre-launch, MVP shipped, beta active
**Website:** bluecrewai.com

---

## Our Tech Stack

### Always use these — no exceptions

| Layer | Tool | Notes |
|-------|------|-------|
| AI — generation | Anthropic Claude API (claude-sonnet-4-6) | All text generation, quote/invoice/SWMS |
| AI — voice | OpenAI Whisper API | Voice transcription |
| AI — vision | AWS Textract | Document + photo scanning |
| Backend | Node.js + Express | REST API server |
| Database | Supabase (PostgreSQL) | Use Supabase client, not raw pg |
| File storage | Supabase Storage | PDFs, images |
| PDF generation | Puppeteer | Headless Chrome — do not use other PDF libs |
| Email | Resend | Not SendGrid (except Safety agent) |
| SMS | Twilio | Payment follow-ups |
| Auth | Clerk | Do not roll your own auth |
| Payments | Stripe | Subscriptions + one-off payment links |
| Frontend | React + Vite | Mobile-first PWA. Not Next.js. |
| Frontend hosting | Vercel | |
| Backend hosting | Railway | |
| Bookkeeping | Xero API | Primary. MYOB as fallback. |
| Font | Plus Jakarta Sans | All weights. No other fonts. |
| Primary colour | #1B6AE4 | Electric blue — use everywhere |

---

## Brand Rules (for any UI work)

- Primary colour: `#1B6AE4`
- Hover colour: `#2979FF`
- Background tints: `#F4F6FB`, `#EBF0FA`
- Font: Plus Jakarta Sans (import from Google Fonts)
- Tone: Direct, no jargon, built for tradies not tech people
- Always mobile-first — tradies use phones on job sites
- Logo: use `/logo.png` — don't recreate it

---

## Our 3 Core Agents

### Agent 3 — Quote Generator (MVP SHIPPED ✅)
- Voice input → Whisper → Claude → quote → Puppeteer PDF → Resend email
- Lives at: `~/tradeos/tradeos-quote-agent/`
- Quote number format: `TOS-YYYYMMDD-XXXX`
- Always includes 10% GST on all line items
- Materials pricing from local CSV (Bunnings/Reece)

### Agent 1 — Admin Invoice (In development)
- Same pipeline as quote agent but output is invoice not quote
- Adds Xero API sync after generation
- Adds Twilio SMS follow-up after 7 days if unpaid

### Agent 2 — Safety/SWMS (Planned)
- Voice/photo input → Claude → SafeWork NSW/VIC compliant SWMS → PDF
- Must reference SafeWork template library (to be built)
- Photo input goes through AWS Textract first

---

## Claude API Usage Pattern

Always use this pattern for Claude API calls:

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic(); // API key from ANTHROPIC_API_KEY env var

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2000,
  messages: [
    {
      role: 'user',
      content: prompt
    }
  ]
});

const result = response.content[0].text;
```

---

## Whisper API Usage Pattern

```javascript
const OpenAI = require('openai');
const openai = new OpenAI(); // API key from OPENAI_API_KEY env var
const fs = require('fs');

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(audioFilePath),
  model: 'whisper-1',
  language: 'en'
});

const text = transcription.text;
```

---

## Database Schema Conventions

- All tables use snake_case
- All tables have: `id` (uuid), `created_at` (timestamptz), `updated_at` (timestamptz)
- User/tradie records linked via `user_id` (Clerk user ID as string)
- All amounts stored in cents (integer) — divide by 100 for display
- GST always stored separately from base amount

---

## Environment Variables

Always use `.env` — never hardcode keys. Expected vars:

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
CLERK_SECRET_KEY=
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
```

⚠️ These keys were exposed in chat — rotate them all before any beta users.

---

## Git Conventions

```bash
# Create a feature branch
git checkout -b feature/[name]

# Commit format
git commit -m "feat: [what you built]"
git commit -m "fix: [what you fixed]"
git commit -m "refactor: [what you cleaned up]"

# Never push directly to main
# Ashmit reviews all PRs before merge
```

**Current branches:**
- `main` — production
- `ashmit` — website pivot content update (awaiting review)

---

## Code Style

- Use `async/await` — no callbacks or `.then()` chains
- Always handle errors with try/catch
- Log errors to console with context: `console.error('Quote generation failed:', error.message)`
- Use descriptive variable names — no single letters except loop indices
- Comment any Claude prompt engineering decisions
- Mobile-first CSS — write mobile styles first, then `@media (min-width: 768px)` for desktop

---

## Australian Business Rules

- GST: always 10%. Add to all line items. Show GST amount separately on quotes/invoices.
- ABN: 11-digit number, format as `XX XXX XXX XXX`
- Currency: AUD always. Format as `$X,XXX.XX`
- Dates: DD/MM/YYYY format (Australian standard)
- Phone: +61 format for Twilio, (0X) XXXX XXXX for display
- SafeWork: NSW uses SafeWork NSW standards, VIC uses WorkSafe Victoria

---

## Project Structure

```
tradeos-quote-agent/
├── src/
│   ├── routes/          # Express routes
│   ├── services/        # Business logic (claude.js, whisper.js, pdf.js, email.js)
│   ├── prompts/         # Claude prompt templates (keep prompts in separate files)
│   ├── utils/           # Helpers (gst.js, formatting.js, validation.js)
│   └── index.js         # App entry point
├── public/              # Static files
├── .env                 # Environment variables (never commit)
├── .env.example         # Template (commit this)
├── CLAUDE.md            # This file
└── package.json
```

---

## Common Tasks

### Adding a new Claude prompt
1. Create file in `src/prompts/[name].js`
2. Export a function that takes parameters and returns a prompt string
3. Import in the relevant service
4. Test with real inputs before shipping

### Adding a new API route
1. Create route in `src/routes/[name].js`
2. Register in `src/index.js`
3. Always validate inputs at the route level
4. Always return `{ success: true, data: {} }` or `{ success: false, error: 'message' }`

### Adding a new Xero integration
1. Use the `xero-node` package
2. OAuth tokens stored in Supabase (`xero_tokens` table)
3. Refresh tokens automatically on 401 responses

---

*BlueCrewAI Claude Code Master Prompt | May 2026*
*Rename this file to CLAUDE.md in your project root for auto-loading.*
