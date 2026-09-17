export default function TopBar({ theme, onToggleTheme }) {
  return (
    <header className="top-bar">
      <div className="brand">
        <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M6 26C6 14 14 6 26 6c0 12-8 20-20 20-1.5 0-2.7-.2-2.7-.2S6 24.5 6 26Z"
            fill="var(--primary)"
          />
          <path d="M8 24c4-6 9-10.5 15-14" stroke="var(--surface)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
        <span className="brand-name">Sprout</span>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === "light" ? "Switch to night mode" : "Switch to day mode"}
        title={theme === "light" ? "Night mode" : "Day mode"}
      >
        {theme === "light" ? (
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </header>
  );
}
