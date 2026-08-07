import { useState } from 'react';

export default function SidebarFilters({ onApply, onReset }) {
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [open, setOpen] = useState(false);

  const apply = () => {
    onApply({ minAge: parseInt(minAge, 10) || 0, maxAge: parseInt(maxAge, 10) || 100 });
  };

  const reset = () => {
    setMinAge('');
    setMaxAge('');
    onReset();
  };

  return (
    <aside className="filters">
      <button className="filters-toggle" onClick={() => setOpen((v) => !v)}>
        ⚙️ Filters {open ? '▲' : '▼'}
      </button>
      <div className={`filter-panel ${open ? 'is-open' : ''}`}>
        <div className="filter-head">⚙️ Filters</div>

        <div className="field">
          <label>Start Date</label>
          <input type="date" />
        </div>

        <div className="field">
          <label>Last Date</label>
          <input type="date" />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Min Age</label>
            <input type="number" placeholder="18" min="15" max="70" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </div>
          <div className="field">
            <label>Max Age</label>
            <input type="number" placeholder="40" min="15" max="70" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={apply}>Apply Filters</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
    </aside>
  );
}
