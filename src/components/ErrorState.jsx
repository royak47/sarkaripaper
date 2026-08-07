import { Link } from 'react-router-dom';

export default function ErrorState({ message }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-icon">⚠️</div>
      <h2>Error</h2>
      <p>{message}</p>
      <Link className="btn-back" to="/" style={{ marginTop: '1rem', display: 'inline-flex' }}>🏠 Home</Link>
    </div>
  );
}
