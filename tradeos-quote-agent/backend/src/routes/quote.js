// Changed: Split generate/send flow, accept tradieProfile, add GET /api/quotes,
//          wire saveQuote after email send, add /api/send-quote endpoint
import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/whisper.js';
import { generateQuote } from '../services/claude.js';
import { generatePDF } from '../services/pdf.js';
import { sendQuoteEmail } from '../services/email.js';
import { saveQuote, getQuotes } from '../services/supabase.js';

const router = express.Router();

// Store audio in memory — max 25MB (Whisper limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// POST /api/transcribe — audio blob → transcript text
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json({ transcript });
  } catch (err) {
    console.error('Transcription error:', err.message);
    res.status(500).json({ error: 'Failed to transcribe audio. Please try again.' });
  }
});

// POST /api/generate-quote — transcript + tradieProfile → quote data (NO email yet)
router.post('/generate-quote', async (req, res) => {
  try {
    const { transcript, tradieProfile } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    // Generate structured quote from Claude, passing tradie profile for dynamic pricing
    const quoteData = await generateQuote(transcript, tradieProfile || null);

    // Build a clean quote ID: TOS-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const quoteId = `TOS-${datePart}-${randPart}`;

    res.json({ success: true, quote: quoteData, quoteId });
  } catch (err) {
    console.error('Quote generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate quote. Please try again.' });
  }
});

// POST /api/send-quote — edited quote items + client info → PDF generated + emailed
router.post('/send-quote', async (req, res) => {
  try {
    const { quoteData, clientName, clientEmail, quoteId, tradieProfile } = req.body;

    if (!quoteData || !clientName || !clientEmail || !quoteId) {
      return res.status(400).json({ error: 'Missing quoteData, clientName, clientEmail, or quoteId' });
    }

    const quoteDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    // Generate PDF with the tradie's profile (logo, business name, payment terms)
    const pdfBuffer = await generatePDF({
      quoteData,
      clientName,
      clientEmail,
      quoteId,
      quoteDate,
      tradieProfile: tradieProfile || null,
    });

    // Send the email with the PDF attached
    await sendQuoteEmail({
      clientName,
      clientEmail,
      quoteData,
      pdfBuffer,
      quoteId,
      businessName: tradieProfile?.businessName || process.env.BUSINESS_NAME || 'TradeOS',
    });

    // Save to Supabase (fire-and-forget — never blocks the response)
    saveQuote({
      quoteNumber: quoteId,
      clientName,
      clientEmail,
      businessName: tradieProfile?.businessName || process.env.BUSINESS_NAME || 'TradeOS',
      items: quoteData.items,
      subtotal: quoteData.subtotalExGST,
      gst: quoteData.gst,
      total: quoteData.totalIncGST,
    }).catch((err) => console.error('[supabase] Background save failed:', err.message));

    res.json({ success: true, quoteId });
  } catch (err) {
    console.error('Send quote error:', err.message);
    res.status(500).json({ error: 'Failed to send quote. Please try again.' });
  }
});

// GET /api/quotes?businessName=XYZ — fetch quote history from Supabase
router.get('/quotes', async (req, res) => {
  try {
    const { businessName } = req.query;
    if (!businessName) {
      return res.status(400).json({ error: 'Missing businessName query parameter' });
    }
    const quotes = await getQuotes(businessName);
    res.json({ quotes });
  } catch (err) {
    console.error('Fetch quotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes.' });
  }
});

export default router;
