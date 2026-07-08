const { parse } = require('csv-parse');
const logger = require('../utils/logger');

/**
 * Parse a CSV buffer into headers and row objects.
 * Auto-detects delimiters, handles BOM, skips empty rows.
 *
 * @param {Buffer} buffer — raw CSV file content
 * @returns {Promise<{ headers: string[], rows: object[] }>}
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');

    if (!content.trim()) {
      return reject(new Error('CSV file is empty'));
    }

    const records = [];

    const parser = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    parser.on('data', (record) => {
      const hasValue = Object.values(record).some((v) => v && v.trim());
      if (hasValue) {
        records.push(record);
      }
    });

    parser.on('error', (err) => {
      logger.error('CSV parse error:', err.message);
      reject(new Error(`Failed to parse CSV: ${err.message}`));
    });

    parser.on('end', () => {
      if (records.length === 0) {
        return reject(new Error('CSV file contains no data rows'));
      }

      const headers = Object.keys(records[0]);
      logger.info(`Parsed CSV: ${headers.length} columns, ${records.length} rows`);
      resolve({ headers, rows: records });
    });
  });
}

module.exports = { parseCSV };
