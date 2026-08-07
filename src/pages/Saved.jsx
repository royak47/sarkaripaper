import { Link } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import { sectionMeta } from '../sections';
import EmptyState from '../components/EmptyState';

export default function Saved() {
  const { bookmarks, toggle } = useBookmarks();

  return (
    <div className="fade-in">
      <div className="list-head">
        <h2 className="list-title">🔖 Saved</h2>
        <span className="list-count">{bookmarks.length} Items</span>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState title="Abhi kuch save nahi kiya" icon="🔖">
          <p>Kisi bhi notice par ☆ dabao, wo yahan dikhega.</p>
        </EmptyState>
      ) : (
        <div className="board">
          {bookmarks.map((item) => {
            const info = sectionMeta(item.section);
            const to = `/job/${encodeURIComponent(item.slug)}${item.sarkari_link ? `?url=${encodeURIComponent(item.sarkari_link)}` : ''}`;
            return (
              <article key={item.slug} className={`notice accent-${info.accent}`}>
                <div className="notice-top">
                  <span className="notice-stamp">{info.icon} {info.label}</span>
                  <button className="save-btn saved" onClick={() => toggle(item)} title="Saved list se hatao">★</button>
                </div>
                <Link to={to} className="notice-body">
                  <h3 className="notice-title">{item.title}</h3>
                  <div className="notice-foot">
                    <span className="notice-date">🕐 Saved</span>
                    <span className="notice-go">Open →</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
