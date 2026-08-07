import { Link } from 'react-router-dom';
import JobCard from './JobCard';
import HorizontalStrip from './HorizontalStrip';

export default function SectionBlock({
  id,
  title,
  icon,
  items,
  sectionKey,
  viewAllTo,
  layout = 'grid',
  loading = false,
  emptyText,
}) {
  return (
    <section className="section-block" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="section-block__head">
        <h2 className="section-block__title" id={id ? `${id}-title` : undefined}>
          {icon && <span className="section-block__icon" aria-hidden>{icon}</span>}
          {title}
          {items?.length > 0 && <span className="section-block__count">{items.length}</span>}
        </h2>
        {viewAllTo && (
          <Link to={viewAllTo} className="section-block__more">
            View all →
          </Link>
        )}
      </div>

      {loading && (
        <div className="card-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {!loading && layout === 'horizontal' && (
        <HorizontalStrip items={items} sectionKey={sectionKey} emptyText={emptyText} />
      )}

      {!loading && layout === 'grid' && items?.length > 0 && (
        <div className="card-grid">
          {items.map((item) => (
            <JobCard key={item.slug} item={item} sectionKey={sectionKey} />
          ))}
        </div>
      )}

      {!loading && (!items || items.length === 0) && emptyText && (
        <p className="strip-empty">{emptyText}</p>
      )}
    </section>
  );
}
