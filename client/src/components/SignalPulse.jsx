export default function SignalPulse({ articles, stats }) {
  const rankedCategories = [...stats].sort((a, b) => b.count - a.count);
  const leadCategory = rankedCategories[0];
  const totalTracked = stats.reduce((total, item) => total + item.count, 0);
  const analyzedInView = articles.filter((article) => article.status === 'done').length;
  const leadShare = totalTracked && leadCategory
    ? Math.round((leadCategory.count / totalTracked) * 100)
    : 0;

  return (
    <section className="signal-pulse" aria-labelledby="signal-pulse-title">
      <div className="signal-pulse-copy">
        <p className="signal-eyebrow"><span className="signal-live-dot" /> ASTRA / INTELLIGENCE PULSE</p>
        <h2 id="signal-pulse-title">Your signal picture, at a glance.</h2>
        <p className="signal-description">
          {leadCategory
            ? `${leadCategory.category} is your leading coverage area, representing ${leadShare}% of tracked articles.`
            : 'Add intelligence to establish your first coverage picture.'}
        </p>
        <div className="signal-focus">
          <span className="signal-focus-label">LEADING DOMAIN</span>
          <strong>{leadCategory?.category || 'Awaiting signals'}</strong>
          {leadCategory && <span className="signal-focus-share">{leadCategory.count} tracked</span>}
        </div>
      </div>

      <div className="signal-pulse-visual" aria-hidden="true">
        <div className="signal-radar">
          <div className="signal-radar-sweep" />
          <span className="signal-radar-point signal-point-one" />
          <span className="signal-radar-point signal-point-two" />
          <span className="signal-radar-point signal-point-three" />
          <span className="signal-radar-core" />
        </div>
        <span className="signal-radar-caption">MONITORING // {stats.length.toString().padStart(2, '0')} DOMAINS</span>
      </div>

      <div className="signal-pulse-metrics" aria-label="Current dashboard metrics">
        <div className="signal-metric">
          <span className="signal-metric-value">{totalTracked}</span>
          <span className="signal-metric-label">Articles tracked</span>
        </div>
        <div className="signal-metric">
          <span className="signal-metric-value">{stats.length.toString().padStart(2, '0')}</span>
          <span className="signal-metric-label">Coverage domains</span>
        </div>
        <div className="signal-metric">
          <span className="signal-metric-value">{analyzedInView}<small>/{articles.length}</small></span>
          <span className="signal-metric-label">AI analyzed in view</span>
        </div>
      </div>
    </section>
  );
}
