import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles, getStats } from './api.js';
import { useAuth } from './auth/AuthContext.jsx';
import Filters from './components/Filters.jsx';
import ArticleCard from './components/ArticleCard.jsx';
import AddArticleForm from './components/AddArticleForm.jsx';
import BriefBox from './components/BriefBox.jsx';
import StatsBar from './components/StatsBar.jsx';
import SignalPulse from './components/SignalPulse.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadArticles() {
    setLoading(true);
    setError('');
    try {
      setArticles(await getArticles(filters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      setStats(await getStats());
    } catch {
      setStats([]);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  function refreshAll() {
    loadArticles();
    loadStats();
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="page">
      <header className="header dashboard-header">
        <div>
          <h1>ASTRA Sentinel</h1>
          <p>Defence technology news, sorted and summarised by AI</p>
        </div>
        <div className="account-actions">
          <span className="muted">{user.name}</span>
          <button type="button" className="secondary" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <SignalPulse articles={articles} stats={stats} />
      <StatsBar stats={stats} />
      <BriefBox />
      <AddArticleForm onAdded={refreshAll} />
      <h2>Articles</h2>
      <Filters filters={filters} setFilters={setFilters} />

      {error && <p className="message error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && articles.length === 0 && (
        <p className="muted">No articles found. Add one above, or run "npm run seed" to load the sample data.</p>
      )}

      {articles.map((article) => (
        <ArticleCard key={article._id} article={article} onChanged={refreshAll} />
      ))}
    </div>
  );
}
