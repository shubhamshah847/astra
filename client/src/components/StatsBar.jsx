// Shows how many articles are in each category as simple bars
export default function StatsBar({ stats }) {
  if (stats.length === 0) return null;

  const biggest = Math.max(...stats.map((s) => s.count));

  return (
    <div className="box">
      <h2>Articles by category</h2>
      {stats.map((s) => (
        <div key={s.category} className="stat-row">
          <span className="stat-name">{s.category}</span>
          <div className="stat-track">
            <div className="stat-bar" style={{ width: (s.count / biggest) * 100 + '%' }} />
          </div>
          <span className="stat-count">{s.count}</span>
        </div>
      ))}
    </div>
  );
}
