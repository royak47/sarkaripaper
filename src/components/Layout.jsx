import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import Footer from './Footer';

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/section/latestjob', label: 'Latest Job' },
  { to: '/section/result', label: 'Result' },
  { to: '/section/online', label: 'New Vacancy' },
  { to: '/section/admitcard', label: 'Admit Card' },
];

function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export default function Layout() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sp-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('sp-theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">SP</span>
          <span>Sarkari Paper</span>
        </Link>
        <div className="topbar-actions">
          <Link to="/search" className="icon-btn" aria-label="Search">
            <IconSearch />
          </Link>
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <IconMoon /> : <IconSun />}
          </button>
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <IconMenu />
          </button>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="Main">
        <div className="nav-tabs-inner">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="page">
        <Outlet />
      </main>

      <Footer />

      {menuOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />
          <aside className="drawer">
            <div className="drawer-head">
              <strong>Menu</strong>
              <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close">
                <IconClose />
              </button>
            </div>
            <nav className="drawer-nav">
              {TABS.map((t) => (
                <Link key={t.to} to={t.to} onClick={() => setMenuOpen(false)}>
                  {t.label}
                </Link>
              ))}
              <Link to="/section/answerkey" onClick={() => setMenuOpen(false)}>Answer Key</Link>
              <Link to="/section/admission" onClick={() => setMenuOpen(false)}>Admission</Link>
              <Link to="/search" onClick={() => setMenuOpen(false)}>Search</Link>
              <Link to="/saved" onClick={() => setMenuOpen(false)}>Saved</Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
