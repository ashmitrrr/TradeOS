import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import quoteRoutes from './routes/quote.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS — explicit origin allowlist ──
const allowedOrigins = [
  'https://bluecrewai.com',
  'https://www.bluecrewai.com',
  'https://app.bluecrewai.com',
  'https://quote.bluecrewai.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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

// ── API key auth ──
const API_KEY = process.env.INTERNAL_API_KEY;
if (!API_KEY) console.warn('⚠️  INTERNAL_API_KEY is not set — API is unprotected!');

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Health check (unprotected — Railway uses this for uptime checks) ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── All routes (protected) ──
app.use('/api', requireApiKey);
app.use('/api', quoteRoutes);

app.listen(PORT, () => {
  console.log(`TradeOS backend running on port ${PORT}`);
});
