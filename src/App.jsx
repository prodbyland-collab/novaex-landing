import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Orders from './pages/Orders';
import Recurring from './pages/Recurring';
import Security from './pages/Security';
import AppLayout from './components/AppLayout';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="markets" element={<Markets />} />
        <Route path="orders" element={<Orders />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="security" element={<Security />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
