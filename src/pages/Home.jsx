import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage } from '../api';

const BLOCKS = [
  { key: 'result', title: 'Result', emoji: '📊' },
  { key: 'admitcard', title: 'Admit Card', emoji: '🎫' },
  { key: 'latestjob', title: 'Latest Job', emoji: '💼' },
];

function JobList({ items, limit = 20 }) {
  const list = (items || []).slice(0, limit);
  if (!list.length) return <div className="empty">No updates yet</div>;
  return (
    <ul className="job-list">
      {list.map((job) => (
        <li key={job.slug}>
          <Link to={`/job/${encodeURIComponent(job.slug)}`} className="job-row">
            <span className="job-row-bullet" />
            <span className="job-row-title">{job.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchHomepage()
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'Failed to load');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 90, margin: '0 0 16px' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="section-block">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="error-box">{error}</div>;

  const sections = data?.sections || {};

  return (
    <>
      <section className="hero">
        <h1>Latest Government Jobs & Results</h1>
        <p>
          Sarkari Naukri, Admit Card, Result aur New Vacancy — ek jagah, fast updates. Apply se pehle official notification
          zaroor padhein.
        </p>
      </section>

      <div className="headline-row">
        <span className="headline-chip">
          <span className="dot" /> Live updates
        </span>
        <span className="headline-chip">SSC · Banking · Railway · State</span>
        <span className="headline-chip">Mobile friendly</span>
      </div>

      {BLOCKS.map(({ key, title, emoji }) => {
        const block = sections[key] || {};
        const listings = block.listings || [];
        return (
          <section key={key} className="section-block">
            <div className="section-head">
              <h2 className="section-title">
                <span>{emoji}</span> {title}
                {listings.length > 0 && <span className="section-badge">{Math.min(listings.length, 20)}</span>}
              </h2>
              <Link to={`/section/${key}`} className="view-more">
                View More →
              </Link>
            </div>
            <JobList items={listings} limit={20} />
          </section>
        );
      })}
    </>
  );
}
