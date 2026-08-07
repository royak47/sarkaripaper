import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">Sarkari Paper</span>
          <span className="brand-tag">Unofficial</span>
        </button>
        <form className="search-box" onSubmit={submit}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job, Admit Card, Result search karein..."
          />
        </form>
      </div>
    </header>
  );
}
