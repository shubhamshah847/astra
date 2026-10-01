import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import Article from './models/Article.js';
import { makeHash, runAI } from './helpers.js';

// Usage:
//   npm run seed                         -> loads data/starter.json (sample articles)
//   npm run seed -- ../my-starter.json   -> loads your own JSON file
// The JSON file must be a list of articles. Field names can be:
//   title, body (or content / text), sourceUrl (or url / source), publishedAt (or date)

const file = process.argv[2] || new URL('./data/starter.json', import.meta.url);
const items = JSON.parse(fs.readFileSync(file, 'utf-8'));

await connectDB();
await Article.init();

for (const item of items) {
  const title = item.title;
  const body = item.body || item.content || item.text;
  if (!title || !body) {
    console.log('Skipped (missing title or text)');
    continue;
  }

  const contentHash = makeHash(body);
  if (await Article.findOne({ contentHash })) {
    console.log('Skipped (already saved):', title);
    continue;
  }

  let date = new Date(item.publishedAt || item.date);
  if (isNaN(date)) date = new Date();

  const article = await Article.create({
    title,
    body,
    sourceUrl: item.sourceUrl || item.url || item.source || '',
    publishedAt: date,
    contentHash,
  });

  await runAI(article);
  console.log(
    article.status === 'done' ? 'Done  ' : 'FAILED',
    '-',
    title,
    '->',
    article.category || article.errorMessage
  );
}

await mongoose.disconnect();
console.log('Seeding finished');
