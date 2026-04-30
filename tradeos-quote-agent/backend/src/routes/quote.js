import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/whisper.js';
import { generateQuote } from '../services/claude.js';
import { generatePDF } from '../services/pdf.js';
import { sendQuoteEmail } from '../services/email.js';

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

// POST /api/generate-quote — transcript + client info → quote data + PDF emailed
router.post('/generate-quote', async (req, res) => {
  try {
    const { transcript, clientName, clientEmail } = req.body;

    if (!transcript || !clientName || !clientEmail) {
      return res.status(400).json({ error: 'Missing transcript, clientName, or clientEmail' });
    }

    // Generate structured quote from Claude
    const quoteData = await generateQuote(transcript);

    // Build a clean quote ID: TOS-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const quoteId = `TOS-${datePart}-${randPart}`;
    const quoteDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    // Generate PDF and email it concurrently after we have the quote
    const pdfBuffer = await generatePDF({ quoteData, clientName, clientEmail, quoteId, quoteDate });
    await sendQuoteEmail({ clientName, clientEmail, quoteData, pdfBuffer, quoteId });

    res.json({ success: true, quote: quoteData, quoteId });
  } catch (err) {
    console.error('Quote generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate quote. Please try again.' });
  }
});

export default router;
