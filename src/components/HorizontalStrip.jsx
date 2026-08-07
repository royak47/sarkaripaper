import JobCard from './JobCard';

export default function HorizontalStrip({ items, sectionKey, emptyText }) {
  if (!items?.length) {
    return emptyText ? <p className="strip-empty">{emptyText}</p> : null;
  }
  return (
    <div className="h-strip" role="list">
      {items.map((item) => (
        <div className="h-strip__item" role="listitem" key={item.slug}>
          <JobCard item={item} sectionKey={sectionKey} variant="compact" />
        </div>
      ))}
    </div>
  );
}
