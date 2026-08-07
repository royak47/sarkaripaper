import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchSearch } from '../api';
import JobCard from '../components/JobCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { BoardSkeleton } from '../components/Skeletons';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSearch(q, true)
      .then((d) => {
        if (!cancelled) setResults(d.results || []);
      })
      .catch(() => {
        if (!cancelled) setError('Search fail ho gaya.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="fade-in search-page">
      <Link className="btn-back" to="/">← Home</Link>
      <h1 className="page-title">
        {q ? (
          <>
            Results for <span className="text-accent">“{q}”</span>
          </>
        ) : (
          'Search'
        )}
      </h1>
      {!q && <p className="page-sub">Header se keyword type karein — live suggestions milenge.</p>}
      {q && <p className="page-sub">{loading ? 'Searching…' : `${results.length} matches`}</p>}

      {error && <ErrorState message={error} />}
      {loading && <BoardSkeleton count={6} />}
      {!loading && q && results.length === 0 && !error && (
        <EmptyState title="Koi result nahi mila" />
      )}
      {!loading && results.length > 0 && (
        <div className="card-grid">
          {results.map((item) => (
            <JobCard key={item.slug} item={item} sectionKey={item.section} />
          ))}
        </div>
      )}
    </div>
  );
}
