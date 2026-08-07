import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchSearch } from '../api';
import NoticeBoard from '../components/NoticeBoard';
import { BoardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) { setLoading(false); setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSearch(query)
      .then((data) => { if (!cancelled) setResults(data.results || []); })
      .catch(() => { if (!cancelled) setError('Search failed.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="fade-in">
      <Link className="btn-back" to="/">← Home</Link>
      <div className="list-head">
        <h2 className="list-title">🔍 "{query}"</h2>
        <span className="list-count">{results.length} Results</span>
      </div>

      {error && <ErrorState message={error} />}
      {!error && loading && <BoardSkeleton count={6} />}
      {!error && !loading && results.length === 0 && <EmptyState title="Koi result nahi mila" />}
      {!error && !loading && results.length > 0 && <NoticeBoard items={results} />}
    </div>
  );
}
