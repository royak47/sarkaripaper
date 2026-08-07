import { useEffect, useState } from 'react';
import { fetchHomepage, fetchSection } from '../api';
import { HOMEPAGE_PREVIEW_SECTIONS, sectionMeta } from '../sections';
import NoticeBoard from '../components/NoticeBoard';
import CategoryTiles from '../components/CategoryTiles';
import { BoardSkeleton } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // The homepage endpoint only fills the latestjob section — the
        // other categories come back empty. So a few extra small calls
        // are made in parallel to give the homepage a real preview of
        // each category, instead of showing nothing (or stale/duplicate
        // items) under them.
        const [home, ...sectionResults] = await Promise.all([
          fetchHomepage(),
          ...HOMEPAGE_PREVIEW_SECTIONS.map((key) => fetchSection(key).catch(() => ({ listings: [] }))),
        ]);

        if (cancelled) return;

        const latest = (home.sections?.latestjob?.listings || []).slice(0, 6);
        setLatestJobs(latest);

        const seen = new Set(latest.map((i) => i.slug));
        const nextPreviews = {};
        HOMEPAGE_PREVIEW_SECTIONS.forEach((key, idx) => {
          const listings = (sectionResults[idx]?.listings || []).filter((i) => !seen.has(i.slug)).slice(0, 3);
          listings.forEach((i) => seen.add(i.slug));
          if (listings.length) nextPreviews[key] = listings;
        });
        setPreviews(nextPreviews);
      } catch (err) {
        if (!cancelled) setError('Homepage load nahi ho saka. API URL check karo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (loading) return <BoardSkeleton count={6} />;

  return (
    <div className="fade-in">
      {latestJobs.length > 0 && (
        <>
          <div className="divider">🔥 Latest Updates</div>
          <NoticeBoard items={latestJobs} sectionKey="latestjob" />
        </>
      )}

      <div className="divider">📂 Browse by Category</div>
      <CategoryTiles />

      {Object.entries(previews).map(([key, listings]) => {
        const info = sectionMeta(key);
        return (
          <div key={key}>
            <div className="divider">{info.icon} {info.label}</div>
            <NoticeBoard items={listings} sectionKey={key} />
          </div>
        );
      })}
    </div>
  );
}
