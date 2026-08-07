import { Link } from 'react-router-dom';
import { sectionMeta } from '../sections';
import { useBookmarks } from '../hooks/useBookmarks';

export default function NoticeCard({ item, sectionKey }) {
  const key = sectionKey || item.section;
  const info = sectionMeta(key);
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(item.slug);

  const to = `/job/${encodeURIComponent(item.slug)}${item.sarkari_link ? `?url=${encodeURIComponent(item.sarkari_link)}` : ''}`;

  return (
    <article className={`notice accent-${info.accent} ${key === 'latestjob' ? 'notice--pinned' : ''}`}>
      <div className="notice-top">
        <span className="notice-stamp">{info.icon} {info.label}</span>
        <button
          className={`save-btn ${saved ? 'saved' : ''}`}
          title={saved ? 'Saved list se hatao' : 'Save karein'}
          onClick={(e) => {
            e.preventDefault();
            toggle({ slug: item.slug, title: item.title, section: key, sarkari_link: item.sarkari_link });
          }}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
      <Link to={to} className="notice-body">
        <h3 className="notice-title">{item.title}</h3>
        <div className="notice-foot">
          <span className="notice-date">🕐 Just now</span>
          <span className="notice-go">Open →</span>
        </div>
      </Link>
    </article>
  );
}
