import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import Article from './models/Article.js';
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/articles.js';
import briefRoutes from './routes/brief.js';
import { isAuth } from './middleware/auth.middleware.js';
import { connectRedis, redis } from './utils/redis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Keep compatibility with the supplied auth URL paths.
app.use('/api/articles', isAuth, articleRoutes);
app.use('/api/brief', isAuth, briefRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ASTRA Sentinel', redis: redis.status });
});

// If the React app is built, serve it from this same server (used for deployment)
const clientBuild = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Any error ends up here and is sent back as JSON
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await Article.init(); // makes sure the search index exists
  connectRedis();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
