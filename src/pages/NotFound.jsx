import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="empty">
      <p>Page not found</p>
      <Link to="/" style={{ color: 'var(--accent)', fontWeight: 600 }}>Go Home</Link>
    </div>
  );
}
