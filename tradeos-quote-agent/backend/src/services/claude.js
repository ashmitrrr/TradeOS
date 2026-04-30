import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Comprehensive Australian tradie pricing prompt — cached to save tokens on repeat calls
const SYSTEM_PROMPT = `You are a professional quote generator for Australian tradies. Analyse a voice transcript from a tradie and output a detailed, itemised quote in Australian dollars (AUD).

REALISTIC AUSTRALIAN PRICING GUIDE (2024–2025):

Gardening & Landscaping:
- General labour: $75–90/hr
- Lawn mowing: $30–40 per 100sqm (minimum call-out applies)
- Lawn edging: $3–5 per linear metre
- Garden bed weeding: $65–80/hr
- Garden bed mulching (mulch + installation): $90–120 per cubic metre
- Mulch materials only (supply): $65–85 per cubic metre
- Hedge trimming: $65–80/hr
- Pruning shrubs/trees: $75–95/hr
- Fertilising lawn: $40–60 per 100sqm (materials included)
- New turf installation (turf + prep + labour): $35–60 per sqm

Tree Services:
- Small tree removal (<4m height): $300–500
- Medium tree removal (4–8m): $700–1,200
- Large tree removal (8–15m): $1,500–2,800
- Extra large (>15m): $3,000–6,000+
- Stump grinding: $200–350 per stump (size dependent)
- Dead wood / hazard branch removal: $150–400
- Emergency / after-hours: add 50% surcharge

General:
- Green waste / rubbish removal: $220–380 per trailer load
- Site cleanup: $75–90/hr
- Travel / call-out fee: $60–80 (waived if job total >$500)

OUTPUT RULES:
1. Return ONLY valid JSON — no markdown fences, no explanation, no preamble
2. All item unitPrice and subtotal values are GST-EXCLUSIVE (ex-GST)
3. subtotalExGST = sum of all item subtotals
4. gst = subtotalExGST × 0.10 (round to 2 decimal places)
5. totalIncGST = subtotalExGST + gst
6. Generate realistic quantities from the description (e.g. 400sqm lawn → 4 units of "per 100sqm")
7. Separate materials and labour into distinct line items where it adds clarity
8. Add a green waste removal line if the job creates significant waste
9. Include a call-out fee only if job total would be under $500 before adding it
10. jobAddress: extract suburb/city if mentioned, otherwise null

Return exactly this JSON structure:
{
  "jobSummary": "1–2 sentence plain-English summary of the scope of work",
  "jobAddress": "Suburb, State — or null",
  "items": [
    {
      "description": "Specific, professional item description",
      "quantity": 4.0,
      "unit": "per 100sqm",
      "unitPrice": 35.00,
      "subtotal": 140.00
    }
  ],
  "subtotalExGST": 0.00,
  "gst": 0.00,
  "totalIncGST": 0.00,
  "notes": "Any assumptions made or conditions that apply",
  "validDays": 30
}`;

export async function generateQuote(transcript) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }, // Cache the long system prompt — saves ~80% token cost on repeat calls
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a professional itemised quote for the following job:\n\n"${transcript}"`,
      },
    ],
  });

  let text = response.content[0].text.trim();

  // Strip markdown code fences if Claude added them despite instructions
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Extract the JSON object
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Claude returned an unexpected response format');
  }

  const quoteData = JSON.parse(match[0]);

  // Recalculate totals server-side to guarantee correctness
  const subtotal = quoteData.items.reduce((sum, item) => sum + item.subtotal, 0);
  quoteData.subtotalExGST = Math.round(subtotal * 100) / 100;
  quoteData.gst = Math.round(subtotal * 0.1 * 100) / 100;
  quoteData.totalIncGST = Math.round((subtotal + subtotal * 0.1) * 100) / 100;

  return quoteData;
}
