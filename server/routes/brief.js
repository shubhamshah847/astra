import express from 'express';
import Article from '../models/Article.js';
import { generateBrief } from '../llm.js';

const router = express.Router();

// POST /api/brief  { "topic": "autonomous drones" }
// 1. Find the best matching articles in MongoDB
// 2. Give them to the AI
// 3. Return the written brief and the list of source articles
router.post('/', async (req, res, next) => {
  try {
    const topic = (req.body.topic || '').trim();
    if (topic.length < 3) {
      return res.status(400).json({ error: 'Please type a topic (at least 3 letters)' });
    }

    const articles = await Article.find(
      { $text: { $search: topic }, status: 'done' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(8);

    if (articles.length === 0) {
      return res.json({ brief: 'No saved articles match this topic.', sources: [] });
    }

    const brief = await generateBrief(topic, articles);

    res.json({
      brief,
      sources: articles.map((a, index) => ({
        number: index + 1,
        id: a._id,
        title: a.title,
        category: a.category,
         publishedAt: a.publishedAt,
        sourceUrl: a.sourceUrl,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
