import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🧭</div>
      <h2>Page nahi mili</h2>
      <Link className="btn-back" to="/" style={{ marginTop: '1rem', display: 'inline-flex' }}>🏠 Home</Link>
    </div>
  );
}
