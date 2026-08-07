import { NavLink } from 'react-router-dom';
import { SECTIONS } from '../sections';

export default function TabBar() {
  return (
    <nav className="tab-bar">
      <div className="tab-row">
        <NavLink to="/" end className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
          🏠 Home
        </NavLink>
        {Object.entries(SECTIONS).map(([key, info]) => (
          <NavLink
            key={key}
            to={`/section/${key}`}
            className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
          >
            {info.icon} {info.label}
          </NavLink>
        ))}
        <NavLink to="/saved" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
          🔖 Saved
        </NavLink>
      </div>
    </nav>
  );
}
