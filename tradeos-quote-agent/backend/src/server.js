import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import quoteRoutes from './routes/quote.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', quoteRoutes);

app.listen(PORT, () => {
  console.log(`TradeOS backend running on port ${PORT}`);
});
