const express = require('express');
const multer = require('multer');
const { parseCSV } = require('../services/csvParser');
const { processBatches } = require('../services/batchProcessor');
const logger = require('../utils/logger');

const router = express.Router();

// Multer config — store file in memory, max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'), false);
    }
  },
});

/**
 * POST /api/preview
 * Accepts multipart CSV upload, returns parsed headers + rows (no AI).
 */
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a CSV file as "file" field.' });
    }

    const { headers, rows } = await parseCSV(req.file.buffer);

    return res.json({
      headers,
      rows,
      total_rows: rows.length,
    });
  } catch (err) {
    logger.error('Preview error:', err.message);
    const status = err.message.includes('empty') || err.message.includes('no data') ? 400 : 500;
    return res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/import
 * Accepts JSON body { headers, rows } — no file re-upload.
 * Streams NDJSON progress lines, then final result.
 */
router.post('/import', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { headers, rows } = req.body;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "headers" array in request body.' });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Missing or empty "rows" array in request body.' });
    }

    // Set up NDJSON streaming response
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const onProgress = (progress) => {
      res.write(JSON.stringify(progress) + '\n');
      logger.debug(`Batch ${progress.batch}/${progress.total} complete`);
    };

    const result = await processBatches(headers, rows, onProgress);

    // Write final done line
    res.write(JSON.stringify({ type: 'done', result }) + '\n');
    res.end();
  } catch (err) {
    logger.error('Import error:', err.message);

    // If headers already sent (streaming started), write error as NDJSON
    if (res.headersSent) {
      res.write(JSON.stringify({ type: 'error', error: err.message }) + '\n');
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
