import { greeting } from "../utils";

export default function GrowthPanel({ total, pending, completed }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <section className="growth-panel" aria-label="Activity progress">
      <p className="growth-greeting">{greeting()}</p>
      <h1 className="growth-headline">
        {total === 0 ? "No activities scheduled" : `${pending} in progress`}
      </h1>

      <div className="growth-ring-wrap">
        <svg viewBox="0 0 128 128" className="growth-ring" role="img" aria-label={`${pct} percent complete`}>
          <circle cx="64" cy="64" r={radius} className="growth-ring-track" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="growth-ring-progress"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <text x="64" y="58" textAnchor="middle" className="growth-ring-pct">
            {pct}%
          </text>
          {/* removed static inner label to show only the percentage */}
        </svg>
      </div>

      <dl className="growth-stats">
        <div>
          <dt>Planned</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>In Progress</dt>
          <dd>{pending}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{completed}</dd>
        </div>
      </dl>
    </section>
  );
}
