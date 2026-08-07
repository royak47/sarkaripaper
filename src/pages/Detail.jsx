import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { fetchDetail } from '../api';
import { DossierSkeleton } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';
import { useBookmarks } from '../hooks/useBookmarks';

export default function Detail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url') || '';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { isSaved, toggle } = useBookmarks();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDetail(slug, url)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Detail load nahi ho saka.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, url]);

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <DossierSkeleton />;

  const dates = data.dates || {};
  const fees = data.fees || {};
  const age = data.age_limit || {};
  const posts = data.posts || [];
  const links = data.official_links || [];
  const pdfs = data.pdfs || [];
  const hasAnyInfo = Object.keys(dates).length || Object.keys(fees).length || Object.keys(age).length || posts.length;
  const saved = isSaved(slug);

  return (
    <div className="fade-in">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="dossier">
        <div className="dossier-head">
          <div className="dossier-head-top">
            <h1>{data.title || 'No Title'}</h1>
            <button
              className={`save-btn save-btn--lg ${saved ? 'saved' : ''}`}
              onClick={() => toggle({ slug, title: data.title, sarkari_link: url })}
              title={saved ? 'Saved list se hatao' : 'Save karein'}
            >
              {saved ? '★ Saved' : '☆ Save'}
            </button>
          </div>
          <div className="meta-row">
            {data.post_date && <span>📅 {data.post_date}</span>}
            {data.total_posts ? <span>👥 {data.total_posts} Posts</span> : null}
          </div>
        </div>

        <div className="dossier-body">
          {data.short_info && (
            <div className="brief"><strong>📢 Short Info:</strong> {data.short_info}</div>
          )}

          {!hasAnyInfo && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">📄</div>
              <p>Detailed info scrape nahi ho saki.</p>
            </div>
          )}

          {hasAnyInfo && (
            <>
              <div className="fact-grid">
                {Object.keys(dates).length > 0 && (
                  <div className="fact-card">
                    <h3>📅 Important Dates</h3>
                    <ul>{Object.entries(dates).map(([k, v]) => (
                      <li key={k}><span className="k">{k}</span><span className="v">{v}</span></li>
                    ))}</ul>
                  </div>
                )}
                {Object.keys(fees).length > 0 && (
                  <div className="fact-card">
                    <h3>💰 Application Fee</h3>
                    <ul>{Object.entries(fees).map(([k, v]) => (
                      <li key={k}><span className="k">{k}</span><span className="v">{v}</span></li>
                    ))}</ul>
                  </div>
                )}
                {Object.keys(age).length > 0 && (
                  <div className="fact-card">
                    <h3>🎂 Age Limit</h3>
                    <ul>{Object.entries(age).map(([k, v]) => (
                      <li key={k}><span className="k">{k}</span><span className="v">{v}</span></li>
                    ))}</ul>
                  </div>
                )}
              </div>

              {posts.length > 0 && (
                <>
                  <h3 className="section-h3">📋 Vacancy Details {data.total_posts ? `(Total: ${data.total_posts})` : ''}</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Post Name</th><th>Total Post</th><th>Eligibility</th></tr></thead>
                      <tbody>
                        {posts.map((p, i) => (
                          <tr key={i}>
                            <td><strong>{p.post_name}</strong></td>
                            <td><span className="list-count">{p.total}</span></td>
                            <td>{p.eligibility || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {(links.length > 0 || pdfs.length > 0) && (
            <>
              <h3 className="section-h3">🔗 Important Links</h3>
              <div className="link-grid">
                {links.slice(0, 6).map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={`link-chip ${l.score > 100 ? 'primary' : ''}`} title={l.label}>
                    {l.score > 100 ? '⚡ ' : '🔗 '}{l.label}
                  </a>
                ))}
                {pdfs.slice(0, 3).map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="link-chip pdf">
                    📄 {l.label} (PDF)
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
