// Changed: Accept tradieProfile param, inject dynamic tradie context before cached materials guide,
//          added materials-only fallback rates for all supported trades, updated output rules
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Static materials guide — cached to save tokens on repeat calls.
// Labour rates are NOT here; they come from the tradie profile injected per-call.
const MATERIALS_PROMPT = `You are a professional quote generator for Australian tradies. Analyse a job description and output a detailed, itemised quote in Australian dollars (AUD).

MATERIALS-ONLY FALLBACK RATES (2024–2025) — use these for materials and specialised subcontracted services ONLY.
Do NOT use these for standard labour — always use the tradie's own labour rate from the profile above.

Landscaping & Gardening (materials/specialist):
- Lawn mowing: $30–40 per 100sqm (material-equivalent service rate)
- Lawn edging: $3–5 per linear metre
- Mulch materials (supply only): $65–85 per cubic metre
- New turf supply: $12–22 per sqm
- Fertiliser (supply + spread): $40–60 per 100sqm
- Garden bed edging/border material: $15–25 per linear metre

Tree Services (specialist subcontract):
- Small tree removal (<4m): $300–500
- Medium tree removal (4–8m): $700–1,200
- Large tree removal (8–15m): $1,500–2,800
- Stump grinding: $200–350 per stump
- Green waste / rubbish removal: $220–380 per trailer load

Plumbing (materials):
- Copper pipe (15mm): $8–14 per metre
- PVC pipe (40mm): $5–9 per metre
- Standard ball valve: $25–55 each
- Flexi hose: $18–35 each
- Tapware (mid-range supply): $80–220 each
- Hot water unit (supply, 50L electric): $400–600

Electrical (materials):
- TPS cable (2.5mm twin & earth): $2–4 per metre
- Standard GPO: $12–25 each
- Safety switch / RCD: $60–120 each
- LED downlight (supply): $20–45 each
- DBboard single phase: $120–250

Painting (materials):
- Interior paint (premium, per litre): $18–28
- Exterior paint (premium, per litre): $22–35
- Primer (per litre): $12–20
- Drop sheets, tape, prep materials: $30–60 per room
- Coverage: ~12–14sqm per litre (1 coat)

Carpentry & Joinery (materials):
- Timber framing (90×45 MGP10): $4–8 per metre
- Sheet material (12mm ply, per sheet): $55–90
- Doors (hollow core supply): $120–250 each
- Door hardware set: $60–140
- Decking (90×19 treated pine, per metre): $8–14

Tiling (materials):
- Floor tiles (mid-range supply): $35–65 per sqm
- Wall tiles (mid-range supply): $30–55 per sqm
- Tile adhesive (20kg bag covers ~5sqm): $35–55
- Grout (2kg covers ~3sqm): $18–30
- Tile trim/edging: $8–16 per metre

Concreting (materials):
- Ready-mix concrete (per m³): $200–290
- Reinforcing mesh (SL72): $35–55 per sheet
- Formwork timber: $4–8 per metre
- Control joint foam: $4–8 per metre
- Curing compound (per litre): $10–18

Cleaning (materials/consumables):
- Commercial cleaning products: $40–80 per job
- Microfibre cloths/mop heads: $20–40
- High-pressure water (per hour machine cost): $25–40/hr
- Window cleaning fluid + squeegees: $20–35

Pest Control (materials/treatments):
- General pest treatment (product cost per dwelling): $80–150
- Termite bait station (supply per station): $60–120
- Rodent bait station: $25–50

HVAC / Air Conditioning (materials):
- Split system supply (2.5kW, standard brands): $600–900
- Split system supply (5kW): $900–1,400
- Refrigerant gas (per kg): $45–80
- Copper refrigerant line set (per metre): $12–22
- Wall bracket set: $40–80

Pool Maintenance (materials/chemicals):
- Chlorine (granular, 4kg): $30–50
- pH Up/Down (2kg): $18–28
- Pool stabiliser (1kg): $20–35
- Filter sand (25kg): $35–55
- Filter cartridge: $60–150
- Pool pump (supply, 0.75kW): $280–450

General:
- Site cleanup / green waste: $220–380 per trailer load
- Rubbish skip hire (4m³): $300–500

OUTPUT RULES:
1. Return ONLY valid JSON — no markdown fences, no explanation, no preamble
2. All item unitPrice and subtotal values are GST-EXCLUSIVE (ex-GST)
3. subtotalExGST = sum of all item subtotals
4. gst = subtotalExGST × 0.10 (round to 2 decimal places)
5. totalIncGST = subtotalExGST + gst
6. Use the tradie's labour rate for ALL labour line items (from the profile above)
7. Use the materials guide ONLY for materials and specialist subcontract items
8. Include callout fee as a separate line item if provided in the tradie profile and > $0
9. Include payment terms from the tradie profile in the notes field
10. Separate materials and labour into distinct line items
11. Add items the tradie may have forgotten (e.g. tree removal → stump grinding + green waste)
12. Be granular — break jobs into specific components
13. jobAddress: extract suburb/city if mentioned in job description, otherwise null

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
  "notes": "Payment terms and any assumptions or conditions that apply",
  "validDays": 30
}`;

function buildTradieContext(profile) {
  if (!profile) return null;
  const callout = profile.calloutFee > 0
    ? `$${profile.calloutFee} (include as a separate line item)`
    : '$0 (do not include a callout line item)';

  return `You are generating a quote for an Australian tradie with these details:
Business name: ${profile.businessName}
Trade: ${profile.trade}
Labour rate: $${profile.labourRate}/hr
Callout / travel fee: ${callout}
Payment terms: ${profile.paymentTerms}

IMPORTANT RULES FOR THIS QUOTE:
- Use $${profile.labourRate}/hr for ALL labour line items — do not use any other labour rate
- ${profile.calloutFee > 0 ? `Add a "Callout / Travel Fee" line item for $${profile.calloutFee}` : 'Do not add a callout fee line item'}
- Include "${profile.paymentTerms}" as the payment terms in the notes field
- Use Australian market rates for materials only (from the materials guide)
- Be specific and granular with line items
- Return valid JSON only`;
}

export async function generateQuote(transcript, tradieProfile) {
  const dynamicContext = buildTradieContext(tradieProfile);

  const systemBlocks = [
    {
      type: 'text',
      text: MATERIALS_PROMPT,
      cache_control: { type: 'ephemeral' }, // Cache the static materials guide — saves ~80% token cost on repeat calls
    },
    ...(dynamicContext ? [{ type: 'text', text: dynamicContext }] : []),
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemBlocks,
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

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned an unexpected response format');

  const quoteData = JSON.parse(match[0]);

  // Recalculate totals server-side to guarantee correctness
  const subtotal = quoteData.items.reduce((sum, item) => sum + item.subtotal, 0);
  quoteData.subtotalExGST = Math.round(subtotal * 100) / 100;
  quoteData.gst = Math.round(subtotal * 0.1 * 100) / 100;
  quoteData.totalIncGST = Math.round((subtotal + subtotal * 0.1) * 100) / 100;

  return quoteData;
}
