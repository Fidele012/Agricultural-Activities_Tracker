import { useEffect, useRef, useState } from "react";
import { relativeTime } from "../utils";

const PRIORITY_CLASS = { Low: "low", Medium: "medium", High: "high" };

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete, isEditing }) {
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    clearTimeout(timeoutRef.current);
    onDelete(task.id);
  }

  const notStarted = task.status === "Not Started";
  const started = task.status === "Pending";
  const completed = task.status === "Completed";
  const statusClass = task.status ? task.status.replace(/\s+/g, "-") : "";

  return (
    <li className={`task-card priority-${PRIORITY_CLASS[task.priority]} ${completed ? "is-completed" : ""} ${isEditing ? "is-editing" : ""}`}>
      <button
        type="button"
        className={`status-check ${completed ? "checked" : ""}`}
        onClick={() => onToggleStatus(task)}
        aria-pressed={completed}
        aria-label={notStarted ? "Mark as started" : started ? "Mark as completed" : "Completed"}
        title={notStarted ? "Mark as started" : started ? "Mark as completed" : "Completed"}
        disabled={completed}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path d="M4 10.5L8 14.5L16 5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="task-card-body">
        <div className="task-card-top">
          <p className="task-card-title">{task.title}</p>
          <span className={`status-pill status-${statusClass}`}>{task.status}</span>
        </div>

        {task.description && <p className="task-card-desc">{task.description}</p>}

        <div className="task-card-meta">
          <span className={`priority-tag priority-tag-${PRIORITY_CLASS[task.priority]}`}>{task.priority} priority</span>
          <span className="task-card-time">Added {relativeTime(task.createdAt)}</span>
        </div>
      </div>

      <div className="task-card-actions">
        {started && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => onToggleStatus(task, "Not Started")}
            aria-label="Revert to Not Started"
            title="Revert to Not Started"
          >
            ↺
          </button>
        )}
        <button type="button" className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task" title="Edit">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5 13.2l-2.8.6.6-2.8 8.5-8.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={`icon-btn ${confirming ? "icon-btn-danger-confirm" : "icon-btn-danger"}`}
          onClick={handleDeleteClick}
          aria-label={confirming ? "Confirm delete" : "Delete task"}
          title={confirming ? "Click again to confirm" : "Delete"}
        >
          {confirming ? (
            "Sure?"
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.2a1 1 0 0 0 1 .93h3.8a1 1 0 0 0 1-.93l.6-8.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </li>
  );
}
