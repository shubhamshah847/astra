import crypto from 'crypto';
import { analyzeArticle } from './llm.js';

// Make a fingerprint from the article text.
// Same text (even with different spaces or capital letters) = same fingerprint.
export function makeHash(body) {
  const cleaned = body.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

// Ask the AI to analyse an article and save the result.
// If the AI fails, we do NOT crash. We save the article as "failed" so the user can retry.
export async function runAI(article) {
  try {
    const result = await analyzeArticle(article.title, article.body);
    article.category = result.category;
    article.summary = result.summary;
    article.keywords = result.keywords;
    article.entities = result.entities;
    article.status = 'done';
    article.errorMessage = '';
  } catch (err) {
    article.status = 'failed';
    article.errorMessage = err.message;
  }
  await article.save();
  return article;
}
