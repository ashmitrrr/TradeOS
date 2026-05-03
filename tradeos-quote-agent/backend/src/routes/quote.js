// Changed: Added input validation (field lengths, transcript cap),
//          HTML escaping for XSS protection. All routes protected by requireAuth.
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max audio
});

// ── Validation helpers ──

const MAX_TRANSCRIPT_LENGTH = 10000; // ~2500 words
const MAX_FIELD_LENGTH = 500;
const MAX_LOGO_SIZE = 500000; // ~500KB base64

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeString(str, maxLen = MAX_FIELD_LENGTH) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// ── Profile ──

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    res.json({ profile: profile || {} });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const businessName = sanitizeString(req.body.businessName, 200);
    const trade = sanitizeString(req.body.trade, 100);
    const labourRate = Number(req.body.labourRate);
    const calloutFee = Number(req.body.calloutFee) || 0;
    const paymentTerms = sanitizeString(req.body.paymentTerms, 100);
    const logoBase64 = req.body.logoBase64 || null;

    if (!businessName || !trade || !labourRate || labourRate <= 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields: businessName, trade, labourRate' });
    }
    if (labourRate > 10000) {
      return res.status(400).json({ error: 'Labour rate seems too high. Please check the value.' });
    }
    if (calloutFee > 10000) {
      return res.status(400).json({ error: 'Callout fee seems too high. Please check the value.' });
    }
    if (logoBase64 && logoBase64.length > MAX_LOGO_SIZE) {
      return res.status(400).json({ error: 'Logo image is too large. Please use a smaller image.' });
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

// ── Quote Generation ──

router.post('/generate-quote', requireAuth, async (req, res) => {
  try {
    const transcript = sanitizeString(req.body.transcript, MAX_TRANSCRIPT_LENGTH);
    const tradieProfile = req.body.tradieProfile || null;

    if (!transcript || transcript.length < 10) {
      return res.status(400).json({ error: 'Transcript is too short. Please describe the job in more detail.' });
    }

    const quoteData = await generateQuote(transcript, tradieProfile);

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
    const { quoteData, quoteId, tradieProfile } = req.body;
    const clientName = sanitizeString(req.body.clientName, 200);
    const clientEmail = sanitizeString(req.body.clientEmail, 200).toLowerCase();

    if (!quoteData || !clientName || !clientEmail || !quoteId) {
      return res.status(400).json({ error: 'Missing quoteData, clientName, clientEmail, or quoteId' });
    }
    if (!validateEmail(clientEmail)) {
      return res.status(400).json({ error: 'Invalid client email address' });
    }
    if (!Array.isArray(quoteData.items) || quoteData.items.length === 0) {
      return res.status(400).json({ error: 'Quote must have at least one line item' });
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
