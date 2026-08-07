import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { fetchSearch } from '../api';

const RECENT_KEY = 'sp:recent-searches';

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 8);
  } catch {
    return [];
  }
}

function pushRecent(q) {
  const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* */ }
  return next;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState(readRecent);
  const [loadingSug, setLoadingSug] = useState(false);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === '/search' && params.get('q')) {
      setQuery(params.get('q'));
    }
  }, [location]);

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoadingSug(true);
      try {
        const data = await fetchSearch(q, true);
        setSuggestions((data.results || []).slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSug(false);
      }
    }, 280);
    return () => clearTimeout(timer.current);
  }, [query]);

  const submit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setRecent(pushRecent(q));
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">Sarkari Paper</span>
          <span className="brand-tag">Jobs</span>
        </button>

        <div className="search-wrap" ref={boxRef}>
          <form className="search-box" onSubmit={submit}>
            <span className="search-icon" aria-hidden>🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="SSC, RRB, UPPSC, Admit Card..."
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </form>

          {open && (
            <div className="search-panel">
              {query.trim().length < 2 && recent.length > 0 && (
                <div className="search-panel__section">
                  <div className="search-panel__label">Recent</div>
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="search-panel__item"
                      onClick={() => {
                        setQuery(r);
                        setRecent(pushRecent(r));
                        setOpen(false);
                        navigate(`/search?q=${encodeURIComponent(r)}`);
                      }}
                    >
                      🕐 {r}
                    </button>
                  ))}
                </div>
              )}

              {query.trim().length >= 2 && (
                <div className="search-panel__section">
                  <div className="search-panel__label">
                    {loadingSug ? 'Searching…' : 'Suggestions'}
                  </div>
                  {!loadingSug && suggestions.length === 0 && (
                    <div className="search-panel__empty">No matches</div>
                  )}
                  {suggestions.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      className="search-panel__item"
                      onClick={() => {
                        setOpen(false);
                        setRecent(pushRecent(query.trim()));
                        navigate(
                          `/job/${encodeURIComponent(s.slug)}${
                            s.sarkari_link ? `?url=${encodeURIComponent(s.sarkari_link)}` : ''
                          }`
                        );
                      }}
                    >
                      {s.department?.department && (
                        <span className="search-panel__dept">{s.department.department}</span>
                      )}
                      <span>{highlight(s.title || '', query.trim())}</span>
                    </button>
                  ))}
                  {suggestions.length > 0 && (
                    <button type="button" className="search-panel__more" onClick={submit}>
                      See all results for “{query.trim()}” →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
