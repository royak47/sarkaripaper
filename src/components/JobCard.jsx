import { Link } from 'react-router-dom';
import { deadlineLabel, deadlineKind } from '../lib/dates';
import { useBookmarks } from '../hooks/useBookmarks';

/**
 * Premium job card — only renders fields that exist on the item.
 * Supports both listing and deadline-enriched items.
 */
export default function JobCard({ item, sectionKey, variant = 'default' }) {
  const { isSaved, toggle } = useBookmarks();
  if (!item) return null;

  const slug = item.slug;
  const title = item.title || 'Untitled';
  const saved = isSaved(slug);
  const days = item._daysLeft;
  const dlLabel = deadlineLabel(days);
  const dlKind = deadlineKind(days);

  const dept = item.department?.department || item.department?.organization || null;
  const org = item.department?.organization && item.department?.department !== item.department?.organization
    ? item.department.organization
    : null;
  const quals = Array.isArray(item.qualification)
    ? item.qualification.map((q) => q.name || q).filter(Boolean)
    : [];
  const states = Array.isArray(item.states)
    ? item.states.map((s) => s.name || s).filter(Boolean)
    : [];
  const vacancy = item.vacancy?.total || item.total_posts || null;
  const salary = item.salary;
  const examType = item.examType || item.department?.category || null;
  const jobType = item.jobType || null;
  const postDate = item.post_date || null;
  const lastDateRaw = item._lastDateRaw || null;

  const to = `/job/${encodeURIComponent(slug)}${item.sarkari_link ? `?url=${encodeURIComponent(item.sarkari_link)}` : ''}`;

  return (
    <article className={`job-card job-card--${variant}`}>
      <Link to={to} className="job-card__link">
        <div className="job-card__badges">
          {dlLabel && <span className={`badge badge--${dlKind}`}>{dlLabel}</span>}
          {sectionKey === 'latestjob' && days == null && <span className="badge badge--new">NEW</span>}
          {examType && <span className="badge badge--muted">{examType}</span>}
          {jobType && jobType !== 'Permanent' && <span className="badge badge--muted">{jobType}</span>}
        </div>

        {dept && <div className="job-card__dept">{dept}</div>}
        <h3 className="job-card__title">{title}</h3>
        {org && org !== dept && <div className="job-card__org">{org}</div>}

        <div className="job-card__meta">
          {vacancy != null && (
            <span className="meta-chip" title="Vacancies">
              <span className="meta-chip__icon">👥</span>
              {Number(vacancy).toLocaleString('en-IN')} Posts
            </span>
          )}
          {quals.slice(0, 2).map((q) => (
            <span className="meta-chip" key={q}>
              <span className="meta-chip__icon">🎓</span>
              {q}
            </span>
          ))}
          {states.slice(0, 2).map((s) => (
            <span className="meta-chip" key={s}>
              <span className="meta-chip__icon">📍</span>
              {s}
            </span>
          ))}
          {salary?.min != null && (
            <span className="meta-chip" title="Salary">
              <span className="meta-chip__icon">💰</span>
              {salary.symbol || '₹'}
              {Number(salary.min).toLocaleString('en-IN')}
              {salary.max && salary.max !== salary.min
                ? `–${Number(salary.max).toLocaleString('en-IN')}`
                : ''}
              {salary.level ? ` · ${salary.level}` : ''}
            </span>
          )}
        </div>

        <div className="job-card__footer">
          {lastDateRaw && (
            <span className="job-card__date">Last Date: {lastDateRaw}</span>
          )}
          {!lastDateRaw && postDate && (
            <span className="job-card__date">Posted: {postDate}</span>
          )}
          <span className="job-card__cta">View details →</span>
        </div>
      </Link>

      <button
        type="button"
        className={`job-card__save ${saved ? 'is-saved' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle({
            slug,
            title,
            section: sectionKey || item.section,
            sarkari_link: item.sarkari_link,
          });
        }}
        aria-label={saved ? 'Remove from saved' : 'Save job'}
        title={saved ? 'Saved' : 'Save'}
      >
        {saved ? '★' : '☆'}
      </button>
    </article>
  );
}
