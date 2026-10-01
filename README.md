# ASTRA Sentinel


/client => npm run dev
/server=> npm run dev
/docker => docker compose up
ASTRA Sentinel is a defence-technology intelligence dashboard. It helps a user collect and review articles, identify topics and entities, and create concise intelligence briefs from the saved reporting. Article analysis is powered by a configurable LLM provider; NVIDIA NIM is the default.

> **Project status:** Local-development prototype. Configure real database, Redis, email, and AI credentials before using it with real users or deploying it.

## What makes it stand out

The dashboard includes an **Intelligence Pulse** panel with a radar-style visual and a quick view of the leading coverage domain, tracked article count, coverage domains, and AI analyses. The values are calculated from information already loaded by the dashboard; the panel does not introduce a separate analytics service.

## Features

- Account registration, sign-in, sign-out, and protected dashboard/API routes.
- Six-digit email verification codes with expiry, resend cooldown, and attempt limits. Redis stores the temporary verification state; Gmail OAuth sends the emails.
- Save articles through the dashboard form or import a JSON starter file.
- AI-generated category, factual summary, keywords, and entities (organisations, equipment, and countries).
- Search saved articles using MongoDB text search; filter by category and publication date.
- Retry AI analysis for an article if a provider request fails. The article itself is kept when analysis fails.
- Generate an Intelligence Brief from up to eight matching saved articles. The brief prompt restricts the model to those articles and returns its sources.
- Detect exact duplicate article text using a SHA-256 fingerprint.
- View article counts by category and the dashboard Intelligence Pulse.

## Technology

- **Client:** React 18, React Router, Vite.
- **API:** Node.js (18 or later), Express 4.
- **Storage:** MongoDB with Mongoose and a text index.
- **Verification state:** Redis, accessed through ioredis.
- **AI:** NVIDIA NIM OpenAI-compatible chat-completions API by default. Gemini, Anthropic, and other OpenAI-compatible endpoints are also supported by the server code.
- **Email:** Nodemailer with Gmail OAuth2.

`npm run setup` installs the project's dependencies automatically. The client package includes `react`, `react-dom`, `react-router-dom`, `vite`, and `@vitejs/plugin-react`. The server package includes `express`, `mongoose`, `ioredis`, `nodemailer`, `cors`, `cookie-parser`, `dotenv`, `jsonwebtoken`, `bcryptjs`, and `@anthropic-ai/sdk`; the current shared provider adapter sends requests with Node.js `fetch`. The package manifests are the source of truth for exact versions.

## How the application works

```text
Browser (React / Vite)
   | /api and /auth requests
   v
Express API ---- MongoDB (users, articles, text search)
   |                  |
   +-- Redis (OTP)    +-- Search, filters, category counts
   +-- Gmail OAuth2   +-- Saved article sources for briefs
   +-- LLM provider (classification, summary, keywords, entities, brief)
```

## Requirements

Install these before setup:

1. **Node.js 18+** and npm. Use a current LTS release if possible.
2. **MongoDB**, either a local MongoDB Community Server or a MongoDB Atlas connection string.
3. **Redis**. The included Docker Compose file runs Redis locally; Docker Desktop must be installed and running for that option.
4. **An NVIDIA API key** for the default AI provider. Create one using NVIDIA Build at [build.nvidia.com](https://build.nvidia.com/). If selecting another provider, use that provider's own API credentials instead.
5. **Gmail OAuth2 credentials** to send verification and welcome emails. Registration that sends an OTP requires Redis and working email configuration.

## Local setup

Run these commands from the repository root (`astra-sentinel`).

### 1. Install the JavaScript dependencies

```sh
npm run setup
```

This installs the server and client packages in their respective folders. The main libraries are listed in `server/package.json` and `client/package.json`; no separate global install of React, Express, or Vite is needed.

### 2. Create your server environment file

Copy the safe template, then edit the copy with your own local URLs and credentials:

**PowerShell**

```powershell
Copy-Item server/.env.example server/.env
```

**macOS / Linux**

```sh
cp server/.env.example server/.env
```

Open `server/.env` and replace every `your_own_...` or `replace_with_your_own_...` value. Do not commit this file or paste its contents into chats or screenshots. `.env` is ignored by Git; `.env.example` contains variable names and instructions, not real credentials.

For Gmail OAuth2, set `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`. Keep Redis running as well: the sign-up and OTP verification flow depends on it. If you only want to try the dashboard with a previously verified account, the app can start without Redis, but registration/verification will not work.

### 3. Start MongoDB

Start your local MongoDB service, or set `MONGO_URI` in `server/.env` to your Atlas connection string. The local example URI is:

```text
mongodb://127.0.0.1:27017/astra-sentinel
```

Ensure the MongoDB service is reachable before starting the API.

### 4. Start Redis

With Docker Desktop running, start the included Redis service from the repository root:

```sh
docker compose -f server/docker-compose.yml up -d
```

The example configuration uses `redis://127.0.0.1:6379`. To stop Redis later:

```sh
docker compose -f server/docker-compose.yml down
```

### 5. Start the API server

Open a terminal at the repository root and run:

```sh
npm run dev --prefix server
```

The API listens on `http://localhost:5000` by default. Keep this terminal open. You should see a message that MongoDB connected and that the server is running. If Redis is offline, the server can still start, but OTP registration and verification are unavailable.

### 6. Start the React client

Open a **second** terminal at the repository root and run:

```sh
npm run dev --prefix client
```

Vite prints the local client URL, normally `http://localhost:5173`. Open that URL in a browser. During development, Vite proxies `/api` and `/auth` requests to `http://localhost:5000`.

If the API is on another address, create `client/.env.local` and set `VITE_API_TARGET` to that server origin, for example `http://localhost:5001`. Restart Vite after changing it.

### 7. (Optional) Load the sample articles

To import the provided starter articles, run this from the repository root:

```sh
npm run seed
```

The seed process connects to MongoDB, skips exact duplicates, and asks the configured AI provider to analyse each new article. To load a different JSON file, pass its path relative to the server directory:

```sh
npm run seed --prefix server -- ./data/my-articles.json
```

The JSON file should contain an array. Each entry needs a `title` and article text in `body`, `content`, or `text`. Optional source fields are `sourceUrl`, `url`, or `source`; optional date fields are `publishedAt` or `date`.

## Environment variable reference

A complete starter file is provided at [server/.env.example](server/.env.example). The important settings are:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string. |
| `LLM_PROVIDER` | AI provider selection: `nvidia` (default), `gemini`, `anthropic`, or `openai` (OpenAI-compatible API). |
| `NVIDIA_API_KEY` | NVIDIA NIM API key when `LLM_PROVIDER=nvidia`. Required for article analysis and briefs. |
| `NVIDIA_MODEL` | Optional NVIDIA model ID. The code supplies a default if this is unset; model availability can change, so use an active model from your NVIDIA account. |
| `NVIDIA_BASE_URL` | Optional NVIDIA-compatible API base URL; defaults to `https://integrate.api.nvidia.com/v1`. |
| `GEMINI_API_KEY` | Gemini API key if using `LLM_PROVIDER=gemini`. |
| `ANTHROPIC_API_KEY` | Anthropic API key if using `LLM_PROVIDER=anthropic`. |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | Credentials, base URL, and model for an OpenAI-compatible provider. `LLM_MODEL` may also override the model for Gemini or Anthropic, and is a fallback for NVIDIA when `NVIDIA_MODEL` is unset. |
| `JWT_WEB_TOKEN` | Long, private secret used to sign login cookies. Set a strong unique value, especially in production. |
| `REDIS_URI` | Redis connection URL; defaults to local Redis on port 6379. |
| `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` | Gmail sender address and OAuth2 credentials used for OTP and welcome emails. |
| `PORT` | API port; defaults to `5000`. Hosting platforms often provide this automatically. |
| `FRONTEND_ORIGIN` | Frontend origin allowed by the API's credentialed CORS configuration; defaults to `http://localhost:5173`. |
| `NODE_ENV` | Set to `production` in deployment. This enables secure session cookies and requires an explicit JWT secret. |
| `VITE_API_TARGET` | Optional **client-side development** proxy target, set in `client/.env.local` when the API is not on port 5000. |

Set credentials only for the provider you selected. For `LLM_PROVIDER=openai`, the server expects a provider-compatible `LLM_BASE_URL` that ends at the API root (the server appends `/chat/completions`). Never commit real keys, passwords, OAuth tokens, or production connection strings.

## Useful commands

Run these from the repository root:

| Command | What it does |
| --- | --- |
| `npm run setup` | Install server and client dependencies. |
| `npm run dev --prefix server` | Start the backend in watch mode. |
| `npm run dev --prefix client` | Start the Vite development client. |
| `npm run seed` | Load the sample articles. |
| `npm run build` | Build the client for production. |
| `npm start` | Start the backend in production mode; if `client/dist` exists, Express serves the built frontend too. |
| `docker compose -f server/docker-compose.yml up -d` | Start local Redis. |

Build and start a single local production-style server with:

```sh
npm run build
npm start
```

Then open `http://localhost:5000`.

## API overview

Authentication and article endpoints use an HTTP-only session cookie. The app handles sign-in and registration through the UI; the main backend routes are:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Basic API health status. |
| `POST` | `/api/auth/register` | Register and send an email verification code. |
| `POST` | `/api/auth/verify-otp` | Verify a six-digit code and establish a session. |
| `POST` | `/api/auth/login` | Sign in with a verified account. |
| `POST` | `/api/auth/logout` | Clear the session cookie. |
| `GET` | `/api/auth/me` | Return the signed-in user. |
| `GET` | `/api/articles` | List the latest articles; accepts optional `q`, `category`, `from`, and `to` query parameters. |
| `GET` | `/api/articles/stats` | Article counts by category. |
| `POST` | `/api/articles` | Validate, save, and analyse an article. |
| `POST` | `/api/articles/:id/retry` | Retry analysis for a saved article. |
| `POST` | `/api/brief` | Generate a topic brief from matching saved articles. |

All article and brief endpoints require authentication. The server also keeps compatibility aliases for some authentication route paths.

## Troubleshooting

- **The client loads but API calls fail:** confirm both terminals are still running. The client is normally on port 5173, and the API on port 5000. Check `VITE_API_TARGET` if you changed the API port.
- **MongoDB connection error:** start the local MongoDB service or correct `MONGO_URI`; check Atlas network access and database-user permissions when using Atlas.
- **Redis unavailable:** start the Compose service and confirm `REDIS_URI`. The API may still start, but registration and OTP verification need Redis.
- **Verification email cannot be sent:** check all four Gmail OAuth2 variables and ensure the OAuth client/refresh token is valid for the sender account.
- **AI analysis fails:** confirm `LLM_PROVIDER` and the matching provider's key, check model access/model ID, and inspect the API server terminal for the provider's returned error. Use the dashboard's **Retry AI** action after correcting the provider configuration.
- **A duplicate is rejected:** duplicate detection compares normalized article text, so a matching body returns HTTP `409`.
- **Production login cookie is not retained:** use HTTPS, set `NODE_ENV=production`, and configure `FRONTEND_ORIGIN` to the deployed frontend origin.

## Deployment notes

The backend serves the compiled frontend from `client/dist` when that folder exists. A simple single-service deployment can use:

- **Build command:** `npm run setup && npm run build`
- **Start command:** `npm start`
- **Required production variables:** `MONGO_URI`, `LLM_PROVIDER`, the selected provider's API key, `JWT_WEB_TOKEN`, `REDIS_URI`, `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`.
- Set `NODE_ENV=production`; configure `FRONTEND_ORIGIN` if the frontend is hosted on a separate origin. Use managed MongoDB and Redis services for deployment rather than local development instances.

Seed the production database deliberately and only once, using the production database connection and the same AI-provider settings. Never expose secrets in source control or client-side environment variables.

## Project layout

```text
.
├── package.json                 Root setup/build/start/seed scripts
├── client/
│   ├── index.html
│   ├── vite.config.js            Vite dev server and API proxy
│   └── src/
│       ├── App.jsx               Routes and application shell
│       ├── DashboardPage.jsx     Authenticated intelligence dashboard
│       ├── api.js                Client API requests
│       ├── style.css             Application styling
│       ├── auth/                 Session, sign-in, registration, OTP UI
│       └── components/           Article, filters, brief, forms, pulse, stats
└── server/
    ├── index.js                  Express app and startup
    ├── db.js                     MongoDB connection
    ├── llm.js                    Provider adapters and AI prompts
    ├── helpers.js                Article fingerprinting and AI processing
    ├── seed.js                   Starter-data importer
    ├── data/starter.json         Example articles
    ├── models/                   Mongoose user and article models
    ├── routes/                   Auth, article, and brief endpoints
    ├── services/email.service.js Gmail OAuth email delivery
    ├── utils/                    Redis, OTP/auth helpers
    └── docker-compose.yml         Local Redis service
```

## Current limitations

- The dashboard displays at most the latest 100 matching articles.
- Duplicate detection catches identical normalized article text, not semantically similar reporting.
- Search uses MongoDB text search rather than vector or semantic search.
- Article ingestion is manual or file-based; this project does not automatically crawl external news sites.
- AI output depends on the selected provider, model access, and article text. Review generated analysis before relying on it.

## Contribution and disclosure

When adapting or submitting this project, describe tools used, AI-assisted work, your own changes, and the tests you actually performed. Keep that disclosure accurate to your own work; do not claim validation or authorship that you did not complete.
