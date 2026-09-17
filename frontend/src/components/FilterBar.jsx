const FILTERS = ["All", "Not Started", "Pending", "Completed"];

export default function FilterBar({ filter, onFilterChange, search, onSearchChange, searchRef }) {
  return (
    <div className="filter-bar">
      <div className="filter-chips" role="tablist" aria-label="Filter tasks by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`chip ${filter === f ? "chip-active" : ""}`}
            onClick={() => onFilterChange(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="search-wrap">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11L14.2 14.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search tasks… (press /)"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tasks"
        />
      </div>
    </div>
  );
}
