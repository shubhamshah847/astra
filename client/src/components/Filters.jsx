import { useState } from 'react';
import { CATEGORIES } from '../categories.js';

export default function Filters({ filters, setFilters }) {
  // The search box keeps its own text until you press Search
  const [text, setText] = useState(filters.q);

  function handleSearch(e) {
    e.preventDefault();
    setFilters({ ...filters, q: text.trim() });
  }

  function changeFilter(field, value) {
    setFilters({ ...filters, [field]: value });
  }

  function clearAll() {
    setText('');
    setFilters({ q: '', category: '', from: '', to: '' });
  }

  return (
    <div className="box">
      <form onSubmit={handleSearch} className="row">
        <input
          type="text"
          placeholder="Search articles (e.g. drone, submarine)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="row">
        <select value={filters.category} onChange={(e) => changeFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>
          From <input type="date" value={filters.from} onChange={(e) => changeFilter('from', e.target.value)} />
        </label>
        <label>
          To <input type="date" value={filters.to} onChange={(e) => changeFilter('to', e.target.value)} />
        </label>

        <button type="button" className="secondary" onClick={clearAll}>
          Clear
        </button>
      </div>
    </div>
  );
}
