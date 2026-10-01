import { useState } from 'react';
import { makeBrief } from '../api.js';

export default function BriefBox() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await makeBrief(topic));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="box">
      <h2>Intelligence Brief</h2>
      <p className="muted">Type a topic. The AI writes a short brief using only your saved articles.</p>
      <form onSubmit={handleSubmit} className="row">
        <input
          type="text"
          placeholder="e.g. autonomous drones"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Writing brief...' : 'Generate brief'}
        </button>
      </form>

      {error && <p className="message error">{error}</p>}

      {result && (
        <div className="brief">
          <div className="brief-text">{result.brief}</div>
          {result.sources.length > 0 && (
            <>
              <h4>Sources</h4>
              <ol className="sources">
                {result.sources.map((s) => (
                  <li key={s.id} value={s.number}>
                    {s.sourceUrl ? (
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}{' '}
                 <span className="muted">
  ({s.category}, {new Date(s.publishedAt).toLocaleDateString()})
</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
