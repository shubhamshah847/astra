import { useState } from 'react';
import { retryArticle } from '../api.js';

export default function ArticleCard({ article, onChanged }) {
  const [showMore, setShowMore] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await retryArticle(article._id);
    } catch (err) {
      // the card will still show "failed" if this did not work
    }
    setRetrying(false);
    onChanged();
  }

  const date = new Date(article.publishedAt).toLocaleDateString();
  const entities = article.entities || {};

  return (
    <div className="card">
      <div className="card-top">
        <h3>{article.title}</h3>
        {article.category && <span className="badge">{article.category}</span>}
      </div>

      <p className="muted">
        {date}
        {article.sourceUrl && (
          <>
            {' | '}
            <a href={article.sourceUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          </>
        )}
      </p>

      {article.status === 'done' && <p>{article.summary}</p>}

      {article.status === 'failed' && (
        <div className="message error">
          The AI could not analyse this article: {article.errorMessage}
          <button onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Trying...' : 'Retry AI'}
          </button>
        </div>
      )}

      {article.keywords && article.keywords.length > 0 && (
        <div className="chips">
          {article.keywords.map((k) => (
            <span key={k} className="chip">
              {k}
            </span>
          ))}
        </div>
      )}

      {article.status === 'done' && (
        <>
          <button className="link-button" onClick={() => setShowMore(!showMore)}>
            {showMore ? 'Hide entities' : 'Show entities'}
          </button>
          {showMore && (
            <div className="entities">
              <p>
                <strong>Organisations:</strong> {(entities.orgs || []).join(', ') || 'none'}
              </p>
              <p>
                <strong>Equipment:</strong> {(entities.equipment || []).join(', ') || 'none'}
              </p>
              <p>
                <strong>Countries:</strong> {(entities.countries || []).join(', ') || 'none'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
