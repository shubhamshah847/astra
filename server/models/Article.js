import mongoose from 'mongoose';

// This is how one article is stored in MongoDB
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    sourceUrl: { type: String, default: '' },
    publishedAt: { type: Date, default: Date.now },

    // These 4 fields are filled by the AI
    category: { type: String, default: '' },
    summary: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    entities: {
      orgs: { type: [String], default: [] },
      equipment: { type: [String], default: [] },
      countries: { type: [String], default: [] },
    },

    // pending = not analysed yet, done = AI worked, failed = AI had an error
    status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    errorMessage: { type: String, default: '' },

    // A fingerprint of the text. Used to block duplicate articles.
    contentHash: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// This index makes full-text search possible.
// Higher weight = more important when ranking results.
articleSchema.index(
  { title: 'text', keywords: 'text', summary: 'text', body: 'text' },
  { weights: { title: 5, keywords: 3, summary: 2, body: 1 } }
);

export default mongoose.model('Article', articleSchema);
