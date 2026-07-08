# GrowEasy CRM Importer

AI-powered CSV importer that intelligently maps arbitrary CSV formats to a standardized GrowEasy CRM schema using Claude or Gemini AI.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Express-4-green?logo=express)
![Tech Stack](https://img.shields.io/badge/AI-Claude%20%7C%20Gemini-blue)

---

## Overview

Upload any CSV — Facebook Lead Ads, Google Ads exports, real estate CRM dumps, or manually created spreadsheets — and let AI automatically map columns to the GrowEasy CRM format. The system handles messy data, varied column names (including non-English), and automatically extracts phone numbers, emails, statuses, and other CRM fields.

### Architecture

The application is split into two services: a **Next.js 14 frontend** (App Router, Tailwind CSS) that provides a 4-step wizard UI (Upload → Preview → Processing → Results), and an **Express backend** that handles CSV parsing and AI extraction. The backend streams batch processing progress as NDJSON so the frontend can show real-time updates. CSV files are parsed once during preview, and the parsed data is sent as JSON for import — avoiding double uploads. The AI extraction uses a detailed system prompt to handle any CSV column structure intelligently. There is no database; the app is completely stateless.

---

## Tech Stack

| Layer    | Technology                                 |
|----------|--------------------------------------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS      |
| Backend  | Node.js, Express                           |
| AI       | Anthropic Claude claude-sonnet-4-6 (primary), Google Gemini Flash (fallback) |
| Styling  | Tailwind CSS, custom CSS tokens            |
| Infra    | Docker, Docker Compose                     |

---

## Setup

### Prerequisites

- Node.js 18+ and npm
- An API key for either [Anthropic](https://console.anthropic.com/) or [Google AI](https://aistudio.google.com/)

### Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=5000
ANTHROPIC_API_KEY=your_anthropic_key_here    # Primary AI provider
GOOGLE_AI_API_KEY=your_gemini_key_here       # Fallback AI provider
AI_BATCH_SIZE=20                              # Records per AI batch
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Local Development

```bash
# 1. Install & start backend
cd backend
cp .env.example .env      # Edit with your API key
npm install
npm run dev               # Runs on port 5000

# 2. Install & start frontend (new terminal)
cd frontend
npm install
npm run dev               # Runs on port 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...
# OR
export GOOGLE_AI_API_KEY=AIza...

# Build and run
docker compose up --build
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Sample CSV Formats

The `/samples` folder contains test CSVs covering common formats:

| File                       | Format                   | Key Features                                              |
|----------------------------|--------------------------|-----------------------------------------------------------|
| `standard_leads.csv`       | Clean CRM export         | Exact field names, all columns present                    |
| `facebook_leads.csv`       | Facebook Lead Ads        | "Full Name", "Phone Number", "Campaign Name" columns      |
| `google_ads_leads.csv`     | Google Ads export        | "Customer Name", "Contact Email", "Ad Group" columns      |
| `real_estate_leads.csv`    | Real estate CRM dump     | Messy statuses, alt phones, budget info, mixed formats     |

---

## API Endpoints

### `POST /api/preview`
Upload a CSV file (multipart) to get parsed headers and rows.

```bash
curl -F "file=@samples/standard_leads.csv" http://localhost:5000/api/preview
```

### `POST /api/import`
Send parsed data as JSON for AI extraction. Returns NDJSON stream.

```bash
curl -X POST http://localhost:5000/api/import \
  -H "Content-Type: application/json" \
  -d '{"headers": ["name","email"], "rows": [{"name":"John","email":"john@test.com"}]}'
```

### `GET /api/health`
Health check endpoint.

---

## Features

- **AI-Powered Mapping** — Handles any CSV column structure using Claude or Gemini
- **Drag & Drop Upload** — React Dropzone with visual feedback
- **Real-time Progress** — NDJSON streaming shows batch-by-batch processing
- **Automatic Retry** — Failed AI batches are retried once before marking as skipped
- **Client-side CSV Export** — Download results without another server call
- **Dark Mode** — Dark theme by default
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Docker Ready** — One-command deployment with docker-compose

---

## License

MIT
