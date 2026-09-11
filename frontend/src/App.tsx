import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Task = { id: number; title: string; completed: boolean }
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const loadTasks = () => fetch(`${API_URL}/tasks`)
    .then((response) => {
      if (!response.ok) throw new Error('API indisponível')
      return response.json()
    })
    .then(setTasks)
    .catch(() => setError('Inicie o backend e o MySQL para carregar os dados.'))

  useEffect(() => { void loadTasks() }, [])

  async function addTask(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    await fetch(`${API_URL}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setTitle('')
    setError('')
    loadTasks()
  }

  return <main><section className="card">
    <span className="eyebrow">Projeto Interdisciplinar</span>
    <h1>Base full-stack</h1>
    <p>React + TypeScript conectado a Java, Spring Boot e MySQL.</p>
    <form onSubmit={addTask}>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Digite uma tarefa" aria-label="Título da tarefa" />
      <button type="submit">Adicionar</button>
    </form>
    {error && <p className="error">{error}</p>}
    <ul>{tasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul>
  </section></main>
}

export default App
