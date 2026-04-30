# TradeOS — Claude Code Instructions

## Read This First
Read tradeos_context.md before writing any code.

## What We're Building
Agent 3 — Quote Generator MVP.
Tradie speaks into phone → Whisper transcribes → Claude generates quote → PDF created → Email sent to client.

## Tech Stack (stick to this exactly)
- Frontend: React PWA, mobile-first, big buttons, voice-first UI
- Backend: Node.js + Express
- Voice transcription: OpenAI Whisper API
- Quote generation: Anthropic Claude API (claude-sonnet-4-6)
- PDF: Puppeteer
- Email: Resend
- Auth: Clerk
- Database: Supabase (PostgreSQL)
- Payments: Stripe
- Hosting: Vercel (frontend) + Railway (backend)

## Target User
Australian tradies using this on their phone on a job site.
UI must be dead simple. Big buttons. Works one-handed. Voice-first. No complex forms.
Dollar amounts always in AUD. Include GST in quotes.

## Build Order
1. Project structure + environment setup
2. Backend API skeleton (Express server)
3. Whisper voice transcription endpoint
4. Claude quote generation endpoint
5. PDF generation with Puppeteer
6. Email delivery with Resend
7. React PWA frontend (mobile-first)
8. Auth with Clerk
9. Save quotes to Supabase
10. Stripe subscription flow

## Code Rules
- .env for ALL API keys, never hardcode
- Error handling on every API call
- Comments explaining what each section does
- Mobile-first CSS always
- Keep MVP simple — no over-engineering
