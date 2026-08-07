import { Link } from 'react-router-dom';
import { SECTIONS } from '../sections';

export default function Menu() {
  return (
    <div className="fade-in menu-page">
      <h1 className="page-title">Browse</h1>
      <p className="page-sub">All categories from the live feed</p>
      <div className="menu-grid">
        {Object.entries(SECTIONS).map(([key, info]) => (
          <Link key={key} to={`/section/${key}`} className="menu-tile">
            <span className="menu-tile__icon">{info.icon}</span>
            <span className="menu-tile__label">{info.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
