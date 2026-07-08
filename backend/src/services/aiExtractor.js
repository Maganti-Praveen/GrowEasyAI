const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a CRM data extraction specialist. Your job is to intelligently map CSV records (which may have any column names, in any language or format) into a standardized GrowEasy CRM format.

You must handle messy, ambiguous, and varied CSV structures from sources like Facebook Lead Ads, Google Ads, Excel sheets, real estate CRMs, sales reports, and manually created spreadsheets.

EXTRACTION RULES:

1. FIELD MAPPING — intelligently map any column to the correct CRM field:
   - name: full name, lead name, contact name, nombre, नाम, or any name-like field
   - email: email, e-mail, mail, correo, ईमेल, or any email-like field
   - mobile_without_country_code: phone, mobile, cell, contact no, whatsapp, ph, number — strip country code prefix if present
   - country_code: extract from phone if present (e.g. +91), or infer from country field. Default to +91 if India is evident
   - company: company, organization, firm, business, employer
   - city: city, town, location, area, locality
   - state: state, province, region
   - country: country, nation
   - lead_owner: assigned to, owner, agent, rep, salesperson
   - crm_status: status, lead status, stage — map to allowed values
   - crm_note: remarks, notes, comments, follow-up, description, extra info
   - data_source: source, lead source, campaign, channel — map to allowed values
   - possession_time: possession, handover, timeline, expected date
   - created_at: date, created, timestamp, submission date — output in ISO 8601

2. CRM STATUS — map intelligently, use ONLY these values:
   - GOOD_LEAD_FOLLOW_UP → interested, hot lead, follow up, callback, promising, positive
   - DID_NOT_CONNECT → no answer, busy, unreachable, not picked, voicemail, dnc
   - BAD_LEAD → not interested, invalid, junk, wrong number, duplicate, unqualified
   - SALE_DONE → closed, won, purchased, deal done, converted, booked
   - If status cannot be determined, use GOOD_LEAD_FOLLOW_UP as default

3. DATA SOURCE — map to ONLY these values or leave blank:
   - leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots

4. PHONE HANDLING:
   - Strip country code from mobile field, store only digits
   - If multiple phones exist: first goes to mobile_without_country_code, rest appended to crm_note as "Additional phones: ..."

5. EMAIL HANDLING:
   - If multiple emails: first to email field, rest appended to crm_note as "Additional emails: ..."

6. crm_note aggregation:
   - Combine: original notes/remarks + overflow phones + overflow emails + any useful unclassified data
   - Keep it concise and readable

7. SKIP RECORDS — skip (do not include in results) ONLY if:
   - Record has NO email AND NO phone/mobile number (BOTH must be completely absent or empty)
   - Mark as skipped with reason
   CRITICAL: Only skip a record if BOTH email AND mobile/phone are completely absent. If even one of them exists, extract the record. A missing phone with a valid email is still a valid lead. A missing email with a valid phone is still a valid lead.

8. DATE FORMAT: output created_at as a string parseable by JavaScript's new Date() — e.g. "2026-05-13 14:20:48" or ISO 8601

9. UNKNOWN FIELDS: if a column doesn't map to any CRM field but contains useful info, append it to crm_note

RESPONSE FORMAT — respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "extracted": [
    {
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "original_data": {},
      "reason": ""
    }
  ]
}`;

/**
 * Build the user message for a batch of CSV records.
 * @param {string[]} headers
 * @param {object[]} batch
 * @returns {string}
 */
function buildUserPrompt(headers, batch) {
  return `Here are ${batch.length} CSV records to extract. Original headers were: [${headers.join(', ')}]\nRecords:\n${JSON.stringify(batch, null, 2)}`;
}

/**
 * Check if an API key is actually set (not a placeholder).
 * @param {string|undefined} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return !!key && key.length > 10 && !key.includes('your_') && !key.includes('_here');
}

/**
 * Extract CRM data from a batch using Anthropic Claude.
 * @param {string[]} headers
 * @param {object[]} batch
 * @returns {Promise<{ extracted: object[], skipped: object[] }>}
 */
async function extractWithClaude(headers, batch) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(headers, batch) }],
  });

  const text = response.content[0].text;
  return JSON.parse(text);
}

/**
 * Extract CRM data from a batch using Groq (LLaMA via Groq API).
 * @param {string[]} headers
 * @param {object[]} batch
 * @returns {Promise<{ extracted: object[], skipped: object[] }>}
 */
async function extractWithGroq(headers, batch) {
  const Groq = require('groq-sdk');
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(headers, batch) },
    ],
  });

  const text = response.choices[0].message.content;
  return JSON.parse(text);
}

/**
 * Extract CRM data from a batch using Google Gemini Flash.
 * @param {string[]} headers
 * @param {object[]} batch
 * @returns {Promise<{ extracted: object[], skipped: object[] }>}
 */
async function extractWithGemini(headers, batch) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(headers, batch)}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * Determine which AI provider to use and extract a batch.
 * Priority: Anthropic Claude → Groq (LLaMA 3.3 70B) → Google Gemini Flash.
 * @param {string[]} headers
 * @param {object[]} batch
 * @returns {Promise<{ extracted: object[], skipped: object[] }>}
 */
async function extractBatch(headers, batch) {
  const useAnthropic = isValidKey(process.env.ANTHROPIC_API_KEY);
  const useGroq = isValidKey(process.env.GROQ_API_KEY);
  const useGemini = isValidKey(process.env.GOOGLE_AI_API_KEY);

  let provider;
  let extractor;

  if (useAnthropic) {
    provider = 'Claude';
    extractor = extractWithClaude;
  } else if (useGroq) {
    provider = 'Groq (LLaMA 3.3 70B)';
    extractor = extractWithGroq;
  } else if (useGemini) {
    provider = 'Gemini Flash';
    extractor = extractWithGemini;
  } else {
    throw new Error(
      'No AI API key configured. Set ANTHROPIC_API_KEY, GROQ_API_KEY, or GOOGLE_AI_API_KEY.',
    );
  }

  logger.info(`Extracting batch of ${batch.length} records with ${provider}`);

  const result = await extractor(headers, batch);

  // Validate response shape
  if (!result || !Array.isArray(result.extracted)) {
    throw new Error('AI returned invalid response structure');
  }

  return {
    extracted: result.extracted || [],
    skipped: result.skipped || [],
  };
}

module.exports = { extractBatch };
