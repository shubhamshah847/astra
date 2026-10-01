# ASTRA Sentinel

AI-powered defence information monitoring system (ASTRA Build Challenge 03).
It collects defence-technology articles, sorts them into categories, writes AI summaries,
lets you search and filter them, and can write an "Intelligence Brief" on any topic.

## Features

**Must have**
- Email/password registration and login; dashboard and article APIs require an authenticated session
- Redis-backed six-digit email verification with a welcome email after successful verification
- Load articles (starter file or manual form)
- AI category (Aerospace, Naval, Land Systems, Cybersecurity, Space, AI/Robotics, Defence Technology)
- AI summary for every article
- Full-text search (MongoDB text index)
- Dashboard with title, category, date, summary and source link

**Should have**
- Filter by category and date range
- "Add an article" form
- MongoDB storage
- AI keyword extraction
- Error handling: empty or short input, bad links and dates, duplicates (409), AI failures (article is saved and can be retried)

**Bonus (extra)**
- Intelligence Brief: searches saved articles, then the AI writes a brief using only those articles, with sources
- Entity extraction: organisations, equipment, countries
- Duplicate detection using a text fingerprint (hash)
- Articles-by-category chart

## Architecture

```
USER
  |
React frontend (Vite)
  |  /api requests
Node.js + Express backend
  |
  +-- Ingestion: form or seed script --> validate --> duplicate check (hash)
  |
  +-- AI processing: Claude API --> category, summary, keywords, entities
  |
MongoDB (articles + text search index)
  |
  +-- Search / filter API --> dashboard
  +-- Brief API: text search --> top 8 articles --> Claude --> brief
  |
React frontend --> USER
```

## Setup (local)

You need: Node.js 18+, MongoDB, Redis, Gmail OAuth credentials, and an Anthropic API key.

1. Install everything:
   ```
   npm run setup
   ```
2. Create `server/.env`:
   ```
  MONGO_URI=mongodb://127.0.0.1:27017/astra-sentinel
  ANTHROPIC_API_KEY=your-anthropic-api-key
  JWT_WEB_TOKEN=your-long-random-secret
  REDIS_URI=redis://127.0.0.1:6379
  EMAIL_USER=your-sending-gmail-address
  CLIENT_ID=your-google-oauth-client-id
  CLIENT_SECRET=your-google-oauth-client-secret
  REFRESH_TOKEN=your-google-oauth-refresh-token
   ```
  Use a long random value for `JWT_WEB_TOKEN`; set it before deploying. Keep all credentials private.
   - MongoDB: local (`mongodb://127.0.0.1:27017/astra-sentinel`) or a free MongoDB Atlas cluster.
   - API key: https://console.anthropic.com
3. Start Redis (Docker Desktop must be running):
   ```
   docker compose -f server/docker-compose.yml up -d
   ```
4. Load the sample articles (the AI analyses each one):
   ```
   npm run seed
   ```
   To load your own starter file (a JSON list): `npm run seed -- ../path/to/file.json`
5. Start the server (terminal 1):
   ```
   cd server
   npm run dev
   ```
6. Start the React app (terminal 2):
   ```
   cd client
   npm run dev
   ```
7. Open http://localhost:5173. New accounts must verify the email OTP before signing in; a welcome email is sent after verification.

## Deploy (Render or similar)

One service runs both the API and the React app.
- Build command: `npm run setup && npm run build`
- Start command: `npm start`
- Environment variables: `MONGO_URI` (use MongoDB Atlas), `ANTHROPIC_API_KEY`, `JWT_WEB_TOKEN`, `REDIS_URI`, `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`
- Load the sample data into the Atlas database once, by running `npm run seed` on your computer with the Atlas `MONGO_URI` in `server/.env`.

## Project structure

```
server/
  index.js          starts the server
  db.js             connects to MongoDB
  llm.js            ALL the AI code (classify + summary + brief)
  helpers.js        duplicate fingerprint + "run the AI on an article"
  seed.js           loads articles from a JSON file
  models/Article.js how an article is stored
  routes/articles.js  list/search/filter, add, retry, stats
  routes/brief.js     Intelligence Brief
client/src/
  App.jsx           login/register and protected dashboard routes
  auth/             session context, auth forms, route guards
  api.js            calls to the server
  components/       Filters, ArticleCard, AddArticleForm, BriefBox, StatsBar
```

## Limitations and future work

- Duplicate detection only catches the same text, not similar articles (next step: embeddings).
- Search is keyword based (MongoDB text index), not meaning based.
- The dashboard shows the latest 100 matches.

## AI disclosure

FILL THIS IN HONESTLY BEFORE SUBMITTING. Follow the exact block format from the challenge document.

- **Tools used:** (e.g. Claude for generating the first version of the code)
- **Purpose:** (e.g. project scaffolding, routes, React components)
- **Major AI-assisted modules:** (list the files)
- **Custom implementations by me:** (what you changed, added or wrote yourself)
- **Validation steps:** (how you tested it: bad input, duplicates, AI failure, searching, filtering)
