require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const importRoutes = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'groweasy-crm-importer',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api', importRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err.message);

  if (err.message === 'Only CSV files are accepted') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  const isValid = (k) => !!k && k.length > 10 && !k.includes('your_') && !k.includes('_here');
  const aiProvider = isValid(process.env.ANTHROPIC_API_KEY)
    ? 'Claude'
    : isValid(process.env.GROQ_API_KEY)
      ? 'Groq (LLaMA 3.3 70B)'
      : isValid(process.env.GOOGLE_AI_API_KEY)
        ? 'Gemini Flash'
        : 'NONE — set an API key!';
  logger.info(`GrowEasy CRM Importer backend running on port ${PORT}`);
  logger.info(`AI provider: ${aiProvider}`);
});
