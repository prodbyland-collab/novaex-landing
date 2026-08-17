import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import '../styles/app.css';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: '/app', label: 'Portfolio', exact: true },
    { to: '/app/markets', label: 'Markets' },
    { to: '/app/orders', label: 'Orders' },
    { to: '/app/recurring', label: 'Recurring' },
    { to: '/app/security', label: 'Security' },
  ];

  function isActive(item) {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const initials = (user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div>
      <header className="app-header">
        <Link className="brand" to="/app">
          <span className="brand-mark"><span>N</span></span>NOVAX
        </Link>
        <nav className="app-nav">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={isActive(item) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="user-area">
          <span className="user-email">{user?.email}</span>
          <div className="user-avatar">{initials}</div>
          <button className="btn small ghost" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>
      <div className="app-body">
        <Outlet />
      </div>
    </div>
  );
}
