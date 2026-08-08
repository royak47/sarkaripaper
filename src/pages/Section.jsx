import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSection } from '../api';

const LABELS = {
  latestjob: 'Latest Job',
  result: 'Result',
  admitcard: 'Admit Card',
  online: 'New Vacancy',
  admission: 'Admission',
  answerkey: 'Answer Key',
  syllabus: 'Syllabus',
};

export default function Section() {
  const { key } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchSection(key)
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key]);

  const title = LABELS[key] || data?.label || key;

  if (loading) {
    return (
      <div className="section-block">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }
  if (error) return <div className="error-box">{error}</div>;

  const listings = data?.listings || [];

  return (
    <>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>{title}</h1>
      <section className="section-block">
        <div className="section-head">
          <h2 className="section-title">
            {title}
            <span className="section-badge">{listings.length}</span>
          </h2>
        </div>
        {listings.length === 0 ? (
          <div className="empty">No posts in this section yet</div>
        ) : (
          <ul className="job-list">
            {listings.map((job) => (
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
    </>
  );
}
