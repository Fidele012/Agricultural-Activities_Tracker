export default function EmptyState() {
  return (
    <div className="empty-state">
      <svg width="88" height="64" viewBox="0 0 88 64" fill="none" aria-hidden="true">
        <path d="M4 58h80" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 58c0-14 6-22 6-22s6 8 6 22" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M44 58c0-20 8-30 8-30s8 10 8 30" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M70 58c0-11 5-17 5-17s5 6 5 17" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="30" r="3" fill="var(--accent-medium)" />
        <circle cx="52" cy="22" r="3" fill="var(--accent-high)" />
        <circle cx="75" cy="35" r="3" fill="var(--accent-low)" />
      </svg>
      <p className="empty-state-title">No activities scheduled yet</p>
      <p className="empty-state-body">Add your first activity on the left — it'll show up here.</p>
    </div>
  );
}
