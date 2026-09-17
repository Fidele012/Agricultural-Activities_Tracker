import { useEffect, useRef, useState } from "react";

const EMPTY = { title: "", description: "", priority: "Medium", status: "Not Started" };

export default function TaskForm({ editingTask, onSubmit, onCancelEdit, titleRef: externalTitleRef }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const internalTitleRef = useRef(null);
  const titleRef = externalTitleRef || internalTitleRef;

  useEffect(() => {
    if (editingTask) {
      setValues({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
      });
      titleRef.current?.focus();
    } else {
      setValues(EMPTY);
    }
    setError("");
  }, [editingTask]);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!values.title.trim()) {
        setError("Give your task a name before adding it.");
      titleRef.current?.focus();
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit({ ...values, title: values.title.trim() });
      if (!editingTask) setValues(EMPTY);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} aria-label={editingTask ? "Edit activity" : "New activity"}>
      <h2 className="task-form-title">{editingTask ? "Edit task" : "Add a new activity"}</h2>

      <label className="field-label" htmlFor="title">
        Title
      </label>
      <input
        id="title"
        ref={titleRef}
        type="text"
        maxLength={120}
        placeholder="e.g. Water the tomatoes"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
      />

      <label className="field-label" htmlFor="description">
        Notes
      </label>
      <textarea
        id="description"
        rows={3}
        placeholder="Any details worth remembering…"
        value={values.description}
        onChange={(e) => update("description", e.target.value)}
      />

      <div className="field-row">
        <div className="field-col">
          <label className="field-label" htmlFor="priority">
            Priority
          </label>
          <select id="priority" value={values.priority} onChange={(e) => update("priority", e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="field-col">
          <label className="field-label" htmlFor="status">
            Status
          </label>
          <select id="status" value={values.status} onChange={(e) => update("status", e.target.value)}>
            <option value="Not Started">Not Started</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <div className="task-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : editingTask ? "Save changes" : "Add task"}
        </button>
        {editingTask && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
