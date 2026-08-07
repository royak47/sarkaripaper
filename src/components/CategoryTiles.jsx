import { Link } from 'react-router-dom';
import { SECTIONS } from '../sections';

export default function CategoryTiles() {
  return (
    <div className="board-tiles">
      {Object.entries(SECTIONS).map(([key, info]) => (
        <Link key={key} to={`/section/${key}`} className={`tile accent-${info.accent}`}>
          <div className="tile-icon">{info.icon}</div>
          <div>
            <div className="tile-name">{info.label}</div>
            <div className="tile-count">Browse updates →</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
