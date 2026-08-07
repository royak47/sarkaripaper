import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSection } from '../api';
import { sectionMeta } from '../sections';
import NoticeBoard from '../components/NoticeBoard';
import SidebarFilters from '../components/SidebarFilters';
import { BoardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Section() {
  const { key } = useParams();
  const info = sectionMeta(key);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);
  const [ageRange, setAgeRange] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAgeRange(null);

    fetchSection(key)
      .then((data) => { if (!cancelled) setListings(data.listings || []); })
      .catch(() => { if (!cancelled) setError(`${info.label} load nahi ho saka.`); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const filtered = useMemo(() => {
    if (!ageRange) return listings;
    return listings.filter((item) => {
      const match = item.title.toLowerCase().match(/(\d{2})\s*[-–]\s*(\d{2})/);
      if (!match) return true;
      const itemMin = parseInt(match[1], 10);
      const itemMax = parseInt(match[2], 10);
      return !(itemMin < ageRange.minAge || itemMax > ageRange.maxAge);
    });
  }, [listings, ageRange]);

  return (
    <div className="layout">
      <SidebarFilters onApply={setAgeRange} onReset={() => setAgeRange(null)} />
      <main>
        <Link className="btn-back" to="/">← Home</Link>
        <div className="list-head">
          <h2 className="list-title">{info.icon} {info.label}</h2>
          <span className="list-count">{filtered.length} Items</span>
        </div>

        {error && <ErrorState message={error} />}
        {!error && loading && <BoardSkeleton count={8} />}
        {!error && !loading && filtered.length === 0 && <EmptyState title="Koi result nahi mila" />}
        {!error && !loading && filtered.length > 0 && <NoticeBoard items={filtered} sectionKey={key} />}
      </main>
    </div>
  );
}
