import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', end: true, label: 'Home', icon: '🏠' },
  { to: '/section/latestjob', label: 'Jobs', icon: '💼' },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/saved', label: 'Saved', icon: '🔖' },
  { to: '/menu', label: 'Menu', icon: '☰' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' is-active' : '')}
        >
          <span className="bottom-nav__icon" aria-hidden>{t.icon}</span>
          <span className="bottom-nav__label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
