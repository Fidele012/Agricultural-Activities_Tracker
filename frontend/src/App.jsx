import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import GrowthPanel from "./components/GrowthPanel";
import TaskForm from "./components/TaskForm";
import FilterBar from "./components/FilterBar";
import TaskList from "./components/TaskList";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./hooks/useToast";
import { getTasks, createTask, updateTask, setTaskStatus, deleteTask, ApiError } from "./api";

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const notify = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  const titleFieldRef = useRef(null);
  const searchFieldRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const data = await getTasks({ status: filter, search });
      setTasks(data);
    } catch (err) {
      setLoadError(err.message || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  // Fetch whenever filter/search changes (debounced a touch while typing a search)
  useEffect(() => {
    const t = setTimeout(refresh, search ? 220 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  // Keyboard shortcuts: "n" focuses new-task title, "/" focuses search, Esc cancels edit
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchFieldRef.current?.focus();
      } else if (e.key.toLowerCase() === "n" && !typing) {
        e.preventDefault();
        setEditingTask(null);
        titleFieldRef.current?.focus();
      } else if (e.key === "Escape" && editingTask) {
        setEditingTask(null);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingTask]);

  async function handleCreateOrUpdate(values) {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, values);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
      notify(`Updated "${updated.title}."`, "success");
    } else {
      const created = await createTask(values);
      notify(`Added "${created.title}."`, "success");
      await refresh();
    }
  }

  async function handleToggleStatus(task, targetStatus) {
    // If a targetStatus is provided, use it. Otherwise advance forward: Not Started -> Pending -> Completed
    function nextStatusOf(s) {
      if (s === "Not Started") return "Pending";
      if (s === "Pending") return "Completed";
      return s;
    }

    const nextStatus = targetStatus || nextStatusOf(task.status);
    if (nextStatus === task.status) return; // nothing to do for Completed or no-op

    // Optimistic update for snappy feel
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      const updated = await setTaskStatus(task.id, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (nextStatus === "Pending") notify(`Marked "${task.title}" as in progress.`, "default");
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      notify(err instanceof ApiError ? err.message : "Could not update that task.", "error");
    }
  }

  async function handleDelete(id) {
    const removed = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingTask?.id === id) setEditingTask(null);
    try {
      await deleteTask(id);
      notify(removed ? `Removed "${removed.title}."` : "Task removed.", "default");
    } catch (err) {
      if (removed) setTasks((prev) => [...prev, removed]);
      notify(err instanceof ApiError ? err.message : "Could not delete that task.", "error");
    }
  }

  const stats = useMemo(() => {
    const notStarted = tasks.filter((t) => t.status === "Not Started").length;
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    return { total: tasks.length, notStarted, pending, completed };
  }, [tasks]);

  return (
    <div className="app-shell">
      <TopBar theme={theme} onToggleTheme={toggleTheme} />

      <main className="app-layout">
        <aside className="app-sidebar">
          <GrowthPanel {...stats} />
          <TaskForm
            editingTask={editingTask}
            onSubmit={handleCreateOrUpdate}
            onCancelEdit={() => setEditingTask(null)}
            titleRef={titleFieldRef}
          />
        </aside>

        <section className="app-content">
          <FilterBar
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            searchRef={searchFieldRef}
          />
          <TaskList
            tasks={tasks}
            loading={loading}
            loadError={loadError}
            editingId={editingTask?.id}
            onToggleStatus={handleToggleStatus}
            onEdit={setEditingTask}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>Sprout · a small task garden</span>
        <span className="app-footer-hint">
          Press <kbd>n</kbd> for a new task, <kbd>/</kbd> to search
        </span>
      </footer>
    </div>
  );
}
