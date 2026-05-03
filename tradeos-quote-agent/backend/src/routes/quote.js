// Changed: All routes protected by requireAuth middleware.
//          Added GET/PUT /api/profile endpoints. Quotes saved with user_id.
//          GET /api/quotes queries by user_id instead of businessName.
import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { transcribeAudio } from '../services/whisper.js';
import { generateQuote } from '../services/claude.js';
import { generatePDF } from '../services/pdf.js';
import { sendQuoteEmail } from '../services/email.js';
import { saveQuote, getQuotes, getProfile, updateProfile } from '../services/supabase.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ── Profile ──

// GET /api/profile — return current user's tradie profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    res.json({ profile: profile || {} });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile — update current user's tradie profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { businessName, trade, labourRate, calloutFee, paymentTerms, logoBase64 } = req.body;
    if (!businessName || !trade || !labourRate) {
      return res.status(400).json({ error: 'Missing required fields: businessName, trade, labourRate' });
    }
    await updateProfile(req.user.id, { businessName, trade, labourRate, calloutFee, paymentTerms, logoBase64 });
    res.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Transcription ──

router.post('/transcribe', requireAuth, upload.single('audio'), async (req, res) => {
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

// ── Quote Generation (no email) ──

router.post('/generate-quote', requireAuth, async (req, res) => {
  try {
    const { transcript, tradieProfile } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    const quoteData = await generateQuote(transcript, tradieProfile || null);

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const quoteId = `TOS-${datePart}-${randPart}`;

    res.json({ success: true, quote: quoteData, quoteId });
  } catch (err) {
    console.error('Quote generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate quote. Please try again.' });
  }
});

// ── Send Quote (PDF + Email + Save) ──

router.post('/send-quote', requireAuth, async (req, res) => {
  try {
    const { quoteData, clientName, clientEmail, quoteId, tradieProfile } = req.body;

    if (!quoteData || !clientName || !clientEmail || !quoteId) {
      return res.status(400).json({ error: 'Missing quoteData, clientName, clientEmail, or quoteId' });
    }

    const quoteDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const pdfBuffer = await generatePDF({
      quoteData, clientName, clientEmail, quoteId, quoteDate,
      tradieProfile: tradieProfile || null,
    });

    await sendQuoteEmail({
      clientName, clientEmail, quoteData, pdfBuffer, quoteId,
      businessName: tradieProfile?.businessName || process.env.BUSINESS_NAME || 'TradeOS',
    });

    // Save to Supabase with user_id (fire-and-forget)
    saveQuote({
      quoteNumber: quoteId,
      clientName,
      clientEmail,
      businessName: tradieProfile?.businessName || process.env.BUSINESS_NAME || 'TradeOS',
      items: quoteData.items,
      subtotal: quoteData.subtotalExGST,
      gst: quoteData.gst,
      total: quoteData.totalIncGST,
      userId: req.user.id,
    }).catch((err) => console.error('[supabase] Background save failed:', err.message));

    res.json({ success: true, quoteId });
  } catch (err) {
    console.error('Send quote error:', err.message);
    res.status(500).json({ error: 'Failed to send quote. Please try again.' });
  }
});

// ── Quote History ──

router.get('/quotes', requireAuth, async (req, res) => {
  try {
    const quotes = await getQuotes(req.user.id);
    res.json({ quotes });
  } catch (err) {
    console.error('Fetch quotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes.' });
  }
});

export default router;
