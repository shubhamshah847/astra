import express from 'express';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import { makeHash, runAI } from '../helpers.js';

const router = express.Router();

// GET /api/articles?q=drone&category=Naval&from=2026-01-01&to=2026-12-31
// Search + filter. All parts are optional.
router.get('/', async (req, res, next) => {
  try {
    const { q, category, from, to } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }
    if (category) {
      filter.category = category;
    }
    if (from || to) {
      filter.publishedAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate)) return res.status(400).json({ error: 'Invalid "from" date' });
        filter.publishedAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to + 'T23:59:59');
        if (isNaN(toDate)) return res.status(400).json({ error: 'Invalid "to" date' });
        filter.publishedAt.$lte = toDate;
      }
    }

    const articles = await Article.find(filter)
      .select('-body') // the full text is not needed on the dashboard
      .sort({ publishedAt: -1 })
      .limit(100);

    res.json(articles);
  } catch (err) {
    next(err);
  }
});

// GET /api/articles/stats  ->  how many articles in each category
router.get('/stats', async (req, res, next) => {
  try {
    const rows = await Article.aggregate([
      { $match: { status: 'done' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(rows.map((row) => ({ category: row._id, count: row.count })));
  } catch (err) {
    next(err);
  }
});

// POST /api/articles  ->  add a new article by hand
router.post('/', async (req, res, next) => {
  try {
    const { title, body, sourceUrl, publishedAt } = req.body;

    // Check the input first
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body || body.trim().length < 50) {
      return res.status(400).json({ error: 'Article text must be at least 50 characters' });
    }
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl.trim())) {
      return res.status(400).json({ error: 'Source link must start with http:// or https://' });
    }
    let date = new Date();
    if (publishedAt) {
      date = new Date(publishedAt);
      if (isNaN(date)) return res.status(400).json({ error: 'Invalid date' });
    }

    // Block duplicates
    const contentHash = makeHash(body);
    const existing = await Article.findOne({ contentHash });
    if (existing) {
      return res.status(409).json({ error: 'Duplicate: this article was already added' });
    }

    const article = await Article.create({
      title: title.trim(),
      body: body.trim(),
      sourceUrl: sourceUrl ? sourceUrl.trim() : '',
      publishedAt: date,
      contentHash,
    });

    await runAI(article); // category, summary, keywords, entities

    const result = article.toObject();
    delete result.body;
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate: this article was already added' });
    }
    next(err);
  }
});

// POST /api/articles/:id/retry  ->  run the AI again on a failed article
router.post('/:id/retry', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    await runAI(article);

    const result = article.toObject();
    delete result.body;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
