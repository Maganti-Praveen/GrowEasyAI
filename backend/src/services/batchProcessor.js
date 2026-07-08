const { extractBatch } = require('./aiExtractor');
const logger = require('../utils/logger');

/**
 * Process all rows in batches, streaming progress via a callback.
 *
 * @param {string[]} headers — original CSV column names
 * @param {object[]} rows — all parsed CSV row objects
 * @param {(progress: object) => void} onProgress — called after each batch
 * @param {number} [batchSize] — records per AI call (default from env or 20)
 * @returns {Promise<{ success: object[], skipped: object[], total_imported: number, total_skipped: number }>}
 */
async function processBatches(headers, rows, onProgress, batchSize) {
  const size = batchSize || parseInt(process.env.AI_BATCH_SIZE, 10) || 20;
  const batches = [];

  for (let i = 0; i < rows.length; i += size) {
    batches.push(rows.slice(i, i + size));
  }

  const totalBatches = batches.length;
  const allExtracted = [];
  const allSkipped = [];

  logger.info(`Processing ${rows.length} rows in ${totalBatches} batches of ${size}`);

  for (let i = 0; i < totalBatches; i++) {
    const batch = batches[i];
    let result;

    try {
      result = await extractBatch(headers, batch);
    } catch (firstError) {
      logger.warn(`Batch ${i + 1}/${totalBatches} failed, retrying once: ${firstError.message}`);

      try {
        result = await extractBatch(headers, batch);
      } catch (retryError) {
        logger.error(`Batch ${i + 1}/${totalBatches} failed after retry: ${retryError.message}`);

        // Mark entire batch as skipped
        const skippedBatch = batch.map((record) => ({
          original_data: record,
          reason: 'AI processing failed after retry',
        }));
        allSkipped.push(...skippedBatch);

        onProgress({
          type: 'progress',
          batch: i + 1,
          total: totalBatches,
          batchExtracted: 0,
          batchSkipped: batch.length,
        });
        continue;
      }
    }

    // Deduplicate: if AI returned a record in both extracted and skipped, keep only the extracted version
    const extractedIdentifiers = new Set();
    for (const rec of result.extracted) {
      if (rec.email) extractedIdentifiers.add(rec.email.toLowerCase());
      if (rec.mobile_without_country_code) extractedIdentifiers.add(rec.mobile_without_country_code);
    }

    const dedupedSkipped = (result.skipped || []).filter((s) => {
      const orig = s.original_data || {};
      const origValues = Object.values(orig).map((v) => String(v || '').toLowerCase());
      // If any value in the original data matches an extracted email/phone, it was extracted — don't skip
      const isDuplicate = [...extractedIdentifiers].some((id) =>
        origValues.some((v) => v.includes(id.toLowerCase())),
      );
      if (isDuplicate) {
        logger.debug(`Removed duplicate from skipped: ${JSON.stringify(orig)}`);
      }
      return !isDuplicate;
    });

    allExtracted.push(...result.extracted);
    allSkipped.push(...dedupedSkipped);

    onProgress({
      type: 'progress',
      batch: i + 1,
      total: totalBatches,
      batchExtracted: result.extracted.length,
      batchSkipped: (result.skipped || []).length,
    });
  }

  return {
    success: allExtracted,
    skipped: allSkipped,
    total_imported: allExtracted.length,
    total_skipped: allSkipped.length,
  };
}

module.exports = { processBatches };
