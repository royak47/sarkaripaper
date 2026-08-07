import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchDetail } from '../api';
import { DossierSkeleton } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';
import { useBookmarks } from '../hooks/useBookmarks';
import { getLastApplyDate, daysUntil, deadlineLabel, deadlineKind } from '../lib/dates';

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
    fetchDetail(slug, url, true)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Detail load nahi ho saka.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, url]);

  useEffect(() => {
    if (!data) return;
    const seo = data.seo;
    if (seo?.title) document.title = seo.title;
    const desc = seo?.description || data.description || data.short_info;
    setMeta('description', desc);
    if (seo?.canonical) setLink('canonical', seo.canonical);
    if (seo?.openGraph) {
      setMeta('og:title', seo.openGraph.title, 'property');
      setMeta('og:description', seo.openGraph.description, 'property');
      setMeta('og:url', seo.openGraph.url, 'property');
      setMeta('og:type', seo.openGraph.type || 'article', 'property');
    }
    // JSON-LD
    let script = document.getElementById('job-jsonld');
    if (seo?.jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'job-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(seo.jsonLd);
    }
    return () => {
      document.title = 'Sarkari Paper';
    };
  }, [data]);

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <DossierSkeleton />;

  const dates = data.dates || {};
  const fees = data.fees || {};
  const age = data.age_limit || {};
  const posts = data.vacancy?.posts?.length ? data.vacancy.posts : (data.posts || []);
  const totalPosts = data.vacancy?.total ?? data.total_posts;
  const links = data.official_links || [];
  const pdfs = data.pdfs || [];
  const saved = isSaved(slug);
  const lastDate = getLastApplyDate(data);
  const days = daysUntil(lastDate);
  const dlLabel = deadlineLabel(days);
  const dlKind = deadlineKind(days);

  const dept = data.department;
  const quals = data.qualification || [];
  const states = data.states || [];
  const salary = data.salary;
  const selection = data.selectionProcess || [];
  const crumbs = data.seo?.breadcrumb || [];

  return (
    <div className="fade-in detail-page">
      {crumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="breadcrumbs__sep">/</span>}
              {i < crumbs.length - 1 ? (
                <a href={c.url}>{c.name}</a>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <button type="button" className="btn-back" onClick={() => navigate(-1)}>← Back</button>

      <article className="dossier">
        <header className="dossier-head">
          <div className="dossier-head-top">
            <div>
              {dept && (
                <div className="dossier-dept">
                  {dept.department}
                  {dept.category && <span className="badge badge--muted">{dept.category}</span>}
                </div>
              )}
              <h1>{data.title || 'No Title'}</h1>
            </div>
            <button
              type="button"
              className={`save-btn save-btn--lg ${saved ? 'saved' : ''}`}
              onClick={() =>
                toggle({
                  slug,
                  title: data.title,
                  sarkari_link: data.sarkari_link || url,
                  section: 'latestjob',
                })
              }
            >
              {saved ? '★ Saved' : '☆ Save'}
            </button>
          </div>

          <div className="meta-row">
            {dlLabel && <span className={`badge badge--${dlKind}`}>{dlLabel}</span>}
            {data.post_date && <span>📅 {data.post_date}</span>}
            {totalPosts != null && <span>👥 {Number(totalPosts).toLocaleString('en-IN')} Posts</span>}
            {data.jobType && <span>{data.jobType}</span>}
            {data.examType && <span>{data.examType}</span>}
          </div>

          {data.description && (
            <p className="dossier-desc">{data.description}</p>
          )}
        </header>

        <div className="dossier-body">
          {/* Quick facts from enrichment */}
          <div className="fact-grid">
            {quals.length > 0 && (
              <Fact label="Qualification" value={quals.map((q) => q.name || q).join(', ')} />
            )}
            {states.length > 0 && (
              <Fact label="State / Region" value={states.map((s) => s.name || s).join(', ')} />
            )}
            {salary?.min != null && (
              <Fact
                label="Salary"
                value={`${salary.symbol || '₹'}${Number(salary.min).toLocaleString('en-IN')}${
                  salary.max && salary.max !== salary.min
                    ? ` – ${salary.symbol || '₹'}${Number(salary.max).toLocaleString('en-IN')}`
                    : ''
                }${salary.level ? ` (${salary.level})` : ''}`}
              />
            )}
            {dept?.organization && (
              <Fact label="Organization" value={dept.organization} />
            )}
          </div>

          {Object.keys(dates).length > 0 && (
            <Section title="Important Dates">
              <dl className="kv">
                {Object.entries(dates).map(([k, v]) => (
                  <div key={k} className="kv__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {Object.keys(fees).length > 0 && (
            <Section title="Application Fee">
              <dl className="kv">
                {Object.entries(fees).map(([k, v]) => (
                  <div key={k} className="kv__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {Object.keys(age).length > 0 && (
            <Section title="Age Limit">
              <dl className="kv">
                {Object.entries(age).map(([k, v]) => (
                  <div key={k} className="kv__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {posts.length > 0 && (
            <Section title="Vacancy Details">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Post</th>
                      <th>Total</th>
                      <th>Eligibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p, i) => (
                      <tr key={i}>
                        <td>{p.post_name}</td>
                        <td>{p.total}</td>
                        <td>{p.eligibility || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {selection.length > 0 && (
            <Section title="Selection Process">
              <ol className="process-list">
                {selection.map((s, i) => (
                  <li key={i}>{s.name || s}</li>
                ))}
              </ol>
            </Section>
          )}

          {(links.length > 0 || pdfs.length > 0 || data.official_apply_link) && (
            <Section title="Important Links">
              <div className="link-list">
                {data.official_apply_link && (
                  <a className="btn btn-primary" href={data.official_apply_link} target="_blank" rel="noopener noreferrer">
                    Apply / Official Link
                  </a>
                )}
                {links.map((l, i) => (
                  <a key={i} className="btn btn-ghost" href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label || 'Link'}
                  </a>
                ))}
                {pdfs.map((l, i) => (
                  <a key={`p${i}`} className="btn btn-ghost" href={l.url} target="_blank" rel="noopener noreferrer">
                    📄 {l.label || 'PDF'}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(data.tags) && data.tags.length > 0 && (
            <Section title="Tags">
              <div className="tag-row">
                {data.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="dossier-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div className="fact">
      <div className="fact__label">{label}</div>
      <div className="fact__value">{value}</div>
    </div>
  );
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
