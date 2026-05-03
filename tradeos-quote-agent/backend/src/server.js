import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import quoteRoutes from './routes/quote.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS — allow frontend origin(s) ──
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
}));

// ── Body parsing with size limit — prevents huge payload attacks ──
app.use(express.json({ limit: '2mb' })); // 2MB covers logo base64

// ── Rate limiting — protects AI endpoints from abuse ──
// General API: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

// AI-heavy endpoints: 20 requests per 15 minutes per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit reached — please wait a few minutes before generating more quotes.' },
});

app.use('/api', generalLimiter);
app.use('/api/generate-quote', aiLimiter);
app.use('/api/transcribe', aiLimiter);
app.use('/api/send-quote', aiLimiter);

// ── Health check (unprotected) ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── All routes ──
app.use('/api', quoteRoutes);

app.listen(PORT, () => {
  console.log(`TradeOS backend running on port ${PORT}`);
});
