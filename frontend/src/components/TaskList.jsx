import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";

export default function TaskList({ tasks, loading, loadError, editingId, onToggleStatus, onEdit, onDelete }) {
  if (loading) {
    return (
      <ul className="task-list" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="task-card task-card-skeleton" aria-hidden="true" />
        ))}
      </ul>
    );
  }

  if (loadError) {
    return (
      <div className="load-error">
        <p>{loadError}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isEditing={task.id === editingId}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
