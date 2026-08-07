import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchSection } from '../api';
import { sectionMeta, SECTIONS } from '../sections';
import JobCard from '../components/JobCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { BoardSkeleton } from '../components/Skeletons';

export default function Section() {
  const { key } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const info = sectionMeta(key);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);

  const sort = searchParams.get('sort') || 'newest';
  const examFilter = searchParams.get('exam') || '';
  const deptFilter = searchParams.get('dept') || '';
  const qualFilter = searchParams.get('qual') || '';
  const stateFilter = searchParams.get('state') || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSection(key, true)
      .then((d) => {
        if (!cancelled) setListings(d.listings || []);
      })
      .catch(() => {
        if (!cancelled) setError('Section load nahi ho saka.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [key]);

  const filterOptions = useMemo(() => {
    const exams = new Set();
    const depts = new Set();
    const quals = new Set();
    const states = new Set();
    for (const item of listings) {
      if (item.examType) exams.add(item.examType);
      if (item.department?.department) depts.add(item.department.department);
      (item.qualification || []).forEach((q) => quals.add(q.name || q));
      (item.states || []).forEach((s) => states.add(s.name || s));
    }
    return {
      exams: [...exams].sort(),
      depts: [...depts].sort(),
      quals: [...quals].sort(),
      states: [...states].sort(),
    };
  }, [listings]);

  const filtered = useMemo(() => {
    let list = [...listings];
    if (examFilter) list = list.filter((i) => i.examType === examFilter);
    if (deptFilter) list = list.filter((i) => i.department?.department === deptFilter);
    if (qualFilter) {
      list = list.filter((i) =>
        (i.qualification || []).some((q) => (q.name || q) === qualFilter)
      );
    }
    if (stateFilter) {
      list = list.filter((i) =>
        (i.states || []).some((s) => (s.name || s) === stateFilter)
      );
    }
    // newest = API order (scrape order); oldest = reverse
    if (sort === 'oldest') list = list.reverse();
    if (sort === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return list;
  }, [listings, examFilter, deptFilter, qualFilter, stateFilter, sort]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(searchParams);
    if (!v) next.delete(k);
    else next.set(k, v);
    setSearchParams(next);
  };

  if (!SECTIONS[key]) {
    return <EmptyState title="Unknown section" />;
  }

  return (
    <div className="fade-in section-page">
      <Link className="btn-back" to="/">← Home</Link>
      <div className="list-head">
        <h1 className="list-title">
          {info.icon} {info.label}
        </h1>
        <span className="list-count">{filtered.length} items</span>
      </div>

      <div className="filter-bar">
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A–Z</option>
        </select>
        {filterOptions.depts.length > 0 && (
          <select value={deptFilter} onChange={(e) => setParam('dept', e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {filterOptions.depts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        {filterOptions.exams.length > 0 && (
          <select value={examFilter} onChange={(e) => setParam('exam', e.target.value)} aria-label="Exam type">
            <option value="">All exam types</option>
            {filterOptions.exams.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        {filterOptions.quals.length > 0 && (
          <select value={qualFilter} onChange={(e) => setParam('qual', e.target.value)} aria-label="Qualification">
            <option value="">All qualifications</option>
            {filterOptions.quals.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        {filterOptions.states.length > 0 && (
          <select value={stateFilter} onChange={(e) => setParam('state', e.target.value)} aria-label="State">
            <option value="">All states</option>
            {filterOptions.states.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        {(examFilter || deptFilter || qualFilter || stateFilter || sort !== 'newest') && (
          <button type="button" className="btn btn-ghost" onClick={() => setSearchParams({})}>
            Reset
          </button>
        )}
      </div>

      {error && <ErrorState message={error} />}
      {!error && loading && <BoardSkeleton count={8} />}
      {!error && !loading && filtered.length === 0 && (
        <EmptyState title="Koi result nahi mila" />
      )}
      {!error && !loading && filtered.length > 0 && (
        <div className="card-grid">
          {filtered.map((item) => (
            <JobCard key={item.slug} item={item} sectionKey={key} />
          ))}
        </div>
      )}
    </div>
  );
}
