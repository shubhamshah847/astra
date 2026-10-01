import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

function AuthLoading() {
  return <main className="auth-page"><p className="muted">Checking your session...</p></main>;
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
