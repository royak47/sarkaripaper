import { Link } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';

export default function Saved() {
  const { bookmarks } = useBookmarks();

  return (
    <div className="fade-in">
      <Link className="btn-back" to="/">← Home</Link>
      <h1 className="page-title">Saved</h1>
      <p className="page-sub">{bookmarks.length} saved on this device</p>
      {bookmarks.length === 0 && (
        <EmptyState title="Abhi kuch saved nahi hai" />
      )}
      {bookmarks.length > 0 && (
        <div className="card-grid">
          {bookmarks.map((item) => (
            <JobCard key={item.slug} item={item} sectionKey={item.section} />
          ))}
        </div>
      )}
    </div>
  );
}
