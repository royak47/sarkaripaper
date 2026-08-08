import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSearch } from '../api';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSearch(q.trim());
      setResults(data.results || data.listings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>Search</h1>
      <form className="search-box" onSubmit={onSubmit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jobs, exams…"
          aria-label="Search"
        />
        <button type="submit">Go</button>
      </form>
      {loading && <div className="loading">Searching…</div>}
      {error && <div className="error-box">{error}</div>}
      {results && (
        <section className="section-block">
          <div className="section-head">
            <h2 className="section-title">
              Results <span className="section-badge">{results.length}</span>
            </h2>
          </div>
          {results.length === 0 ? (
            <div className="empty">No matches</div>
          ) : (
            <ul className="job-list">
              {results.map((job) => (
                <li key={job.slug}>
                  <Link to={`/job/${encodeURIComponent(job.slug)}`} className="job-row">
                    <span className="job-row-bullet" />
                    <span className="job-row-title">{job.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
