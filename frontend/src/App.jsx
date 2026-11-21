import { useEffect, useState } from 'react';

const API = '/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      setTasks(await res.json());
      setError('');
    } catch {
      setError("Impossible de joindre l'API.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitle('');
    load();
  }

  async function toggle(task) {
    await fetch(`${API}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !task.done }),
    });
    load();
  }

  async function saveEdit(id) {
    if (editingTitle.trim()) {
      await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });
    }
    setEditingId(null);
    load();
  }

  async function remove(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    load();
  }

  const remaining = tasks.filter((t) => !t.done).length;
  const visibleTasks = tasks.filter((t) => {
    if (filter === 'todo') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  return (
    <main className="container">
      <h1>TaskBoard</h1>
      <p className="subtitle">
        {remaining} tâche{remaining > 1 ? 's' : ''} à faire sur {tasks.length}
      </p>

      <form onSubmit={addTask} className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche…"
          aria-label="Titre de la nouvelle tâche"
        />
        <button type="submit">Ajouter</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="filters">
        <button className={filter === 'all' ? '' : 'secondary'} onClick={() => setFilter('all')}>
          Toutes
        </button>
        <button className={filter === 'todo' ? '' : 'secondary'} onClick={() => setFilter('todo')}>
          À faire
        </button>
        <button className={filter === 'done' ? '' : 'secondary'} onClick={() => setFilter('done')}>
          Terminées
        </button>
      </div>

      <ul className="task-list">
        {visibleTasks.map((task) => (
          <li key={task.id} className={task.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggle(task)}
              aria-label={`Terminer ${task.title}`}
            />
            {editingId === task.id ? (
              <>
                <input
                  className="edit-input"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                  autoFocus
                />
                <button onClick={() => saveEdit(task.id)}>OK</button>
              </>
            ) : (
              <>
                <span className="title">{task.title}</span>
                <button
                  className="secondary"
                  onClick={() => {
                    setEditingId(task.id);
                    setEditingTitle(task.title);
                  }}
                >
                  Modifier
                </button>
                <button className="danger" onClick={() => remove(task.id)}>
                  Supprimer
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
