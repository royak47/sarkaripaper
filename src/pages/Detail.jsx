import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchDetail } from '../api';

function Card({ label, children }) {
  if (children == null || children === '' || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="info-card">
      <div className="info-card-label">{label}</div>
      <div className="info-card-body">{children}</div>
    </div>
  );
}

function Kv({ obj }) {
  if (!obj || typeof obj !== 'object') return null;
  const entries = Object.entries(obj).filter(([, v]) => v != null && String(v).trim() !== '');
  if (!entries.length) return null;
  return (
    <div className="kv-grid">
      {entries.map(([k, v]) => (
        <div key={k} className="kv-item">
          <span className="kv-key">{k}</span>
          <span className="kv-val">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Detail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDetail(slug)
      .then((d) => {
        if (alive) {
          setJob(d);
          setError(null);
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <>
        <div className="skeleton" style={{ height: 24, width: 80 }} />
        <div className="skeleton" style={{ height: 80 }} />
        <div className="skeleton" style={{ height: 60 }} />
      </>
    );
  }
  if (error) return <div className="error-box">{error}</div>;
  if (!job) return <div className="empty">Not found</div>;

  const posts = job.posts || job.vacancy?.posts || [];
  const tables = job.tables || [];
  const links = job.official_links || [];
  const pdfs = job.pdfs || [];

  return (
    <>
      <button type="button" className="detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <Card label="Name Of Post">{job.title}</Card>

      {job.post_date && <Card label="Post Date / Update">{job.post_date}</Card>}

      {(job.description || job.short_info) && (
        <Card label="Short Information">
          <p className="muted">{job.description || job.short_info}</p>
        </Card>
      )}

      {job.dates && (
        <Card label="Important Dates">
          <Kv obj={job.dates} />
        </Card>
      )}

      {job.fees && (
        <Card label="Application Fee">
          <Kv obj={job.fees} />
        </Card>
      )}

      {job.age_limit && (
        <Card label="Age Limit">
          <Kv obj={job.age_limit} />
        </Card>
      )}

      {(job.total_posts || posts.length > 0) && (
        <Card label="Vacancy Details">
          {job.total_posts != null && (
            <p style={{ marginBottom: posts.length ? 12 : 0, fontWeight: 600 }}>Total Post : {job.total_posts}</p>
          )}
          {posts.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Post Name</th>
                    <th>Total</th>
                    <th>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.post_name || p.name}</td>
                      <td>{p.total ?? p.count ?? '—'}</td>
                      <td>{p.eligibility || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tables.map((t, i) => (
        <Card key={i} label={t.title || `Table ${i + 1}`}>
          <div className="table-wrap">
            <table className="data-table">
              {t.headers?.length > 0 && (
                <thead>
                  <tr>
                    {t.headers.map((h, j) => (
                      <th key={j}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(t.rows || []).map((row, ri) => (
                  <tr key={ri}>
                    {(Array.isArray(row) ? row : [row]).map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {job.how_to_apply && (
        <Card label="How to Apply">
          <p className="muted">{job.how_to_apply}</p>
        </Card>
      )}

      {(job.official_apply_link || links.length > 0 || pdfs.length > 0) && (
        <Card label="Important Links">
          <div className="link-list">
            {job.official_apply_link && (
              <a className="link-btn apply" href={job.official_apply_link} target="_blank" rel="noopener noreferrer">
                Apply Online <span>→</span>
              </a>
            )}
            {links.map((l, i) => (
              <a key={i} className="link-btn" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label || 'Official Link'} <span>→</span>
              </a>
            ))}
            {pdfs.map((l, i) => (
              <a key={`p${i}`} className="link-btn" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label || 'PDF'} <span>→</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {job.sarkari_link && (
        <Card label="Source">
          <a href={job.sarkari_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            View original post →
          </a>
        </Card>
      )}
    </>
  );
}
