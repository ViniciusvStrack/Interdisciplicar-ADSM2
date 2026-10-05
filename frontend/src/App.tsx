import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './App.css'
import PaymentDemo from './PaymentDemo'

type Role = 'STUDENT' | 'TEACHER'
type User = { id: number; name: string; email: string; phone: string; role: Role }
type ClassItem = { id: number; name: string; modality: string; days: string; timeRange: string; instructor: string; price: number; capacity: number; available: boolean; note?: string }
type Enrollment = { id: number; classOfferingId: number; className: string; days: string; timeRange: string; instructor: string; status: string }
type TeacherClass = { id: number; name: string; days: string; timeRange: string; students: { name: string; email: string; phone: string; status: string }[] }
type Page = 'home' | 'login' | 'register' | 'dashboard'

const API = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:8080/api`

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.detail || body.message || 'Não foi possível concluir a operação.', response.status)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      request<ClassItem[]>('/catalog/classes').then(setClasses).catch(() => setClasses([])),
      request<User>('/auth/me').then(value => { setUser(value); setPage('dashboard') }).catch(() => undefined),
    ]).finally(() => setLoading(false))
  }, [])

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 4000)
  }

  const logout = async () => {
    await request<void>('/auth/logout', { method: 'POST' })
    setUser(null)
    setPage('home')
  }

  if (loading) return <div className="loading">Carregando Spirit Hard...</div>
  if (page === 'login' || page === 'register') {
    return <AuthPage mode={page} onBack={() => setPage('home')} onAuthenticated={value => { setUser(value); setPage('dashboard') }} onSwitch={setPage} />
  }
  if (page === 'dashboard' && user) {
    return <><Dashboard user={user} classes={classes} onLogout={logout} notify={notify} />{message && <div className="toast" role="status">{message}</div>}</>
  }

  return <>
    <header className="nav container">
      <button className="brand"><span>SH</span><strong>Spirit Hard<small>Artes marciais</small></strong></button>
      <nav><a href="#academia">A academia</a><a href="#modalidades">Modalidades</a><a href="#contato">Contato</a></nav>
      <button className="btn btn-dark" onClick={() => setPage(user ? 'dashboard' : 'login')}>{user ? 'Meu painel' : 'Entrar'} →</button>
    </header>
    <main>
      <section className="hero-section"><div className="container hero-grid">
        <div className="hero-copy"><span className="tag">Disciplina • Foco • Respeito • Evolução</span><h1>Treine forte.<br/><em>Viva melhor.</em></h1><p>Jiu-jitsu, Muay Thai e Boxe para crianças e adultos. Faça seu cadastro, escolha uma turma e acompanhe suas inscrições.</p><div className="hero-actions"><button className="btn btn-primary" onClick={() => setPage('register')}>Criar minha conta</button><a href="#modalidades">Ver turmas ↓</a></div></div>
        <div className="hero-art"><div className="belt belt-one"/><div className="belt belt-two"/><div className="fighter">SH<span>SPIRIT HARD</span></div><div className="floating-card"><span>ENDEREÇO</span><strong>Janga, Paulista</strong><small>R. Severino Monteiro de Jesus, 569</small></div></div>
      </div></section>
      <section className="values"><div className="container value-grid"><article><span>01</span><h3>Jiu-jitsu</h3><p>Turmas adulto e kids em diferentes horários.</p></article><article><span>02</span><h3>Muay Thai</h3><p>Treinos com o professor A. Ribeiro.</p></article><article><span>03</span><h3>Boxe</h3><p>Turmas com Vinícius Dantas e João Paulo.</p></article></div></section>
      <section id="academia" className="section container about"><div><span className="section-label">Spirit Hard</span><h2>Uma equipe para<br/><em>evoluir junto.</em></h2></div><div><p>Treinamento de artes marciais para todas as idades, com acompanhamento dos professores e inscrições organizadas pelo sistema.</p><p>Alunos veem suas próprias atividades; professores acompanham somente os alunos das turmas pelas quais são responsáveis.</p></div></section>
      <section id="modalidades" className="section schedule"><div className="container"><div className="section-head"><div><span className="section-label">Grade de horários</span><h2>Escolha sua <em>turma</em>.</h2></div><p>É necessário entrar ou criar uma conta antes de fazer a inscrição.</p></div>
        <ClassList items={classes} action={item => { sessionStorage.setItem('desiredClass', String(item.id)); setPage('login') }} actionLabel="Inscrever-se" />
      </div></section>
      <section id="contato" className="cta"><div className="container"><span>OSS!</span><div><h2>Pronto para começar?</h2><p>Cadastre-se e reserve sua turma.</p></div><button className="btn btn-light" onClick={() => setPage('register')}>Fazer cadastro →</button></div></section>
    </main>
    <footer><div className="container"><div className="brand light-brand"><span>SH</span><strong>Spirit Hard<small>Artes marciais</small></strong></div><p>R. Severino Monteiro de Jesus, 569<br/>Janga, Paulista - PE, 53437-440</p><p>Segunda a sexta<br/>09:00 às 18:00</p></div></footer>
    {message && <div className="toast">{message}</div>}
  </>
}

function AuthPage({ mode, onBack, onAuthenticated, onSwitch }: { mode: 'login' | 'register'; onBack: () => void; onAuthenticated: (user: User) => void; onSwitch: (page: Page) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true); setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const user = await request<User>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) })
      onAuthenticated(user)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Erro inesperado.') }
    finally { setBusy(false) }
  }
  return <div className="auth-page"><aside><button className="brand light-brand" onClick={onBack}><span>SH</span><strong>Spirit Hard<small>Artes marciais</small></strong></button><div><span className="tag light">Bem-vindo</span><h1>Seu caminho começa no <em>tatame.</em></h1><p>Acesse suas turmas e acompanhe suas inscrições em um só lugar.</p></div><small>© 2026 Spirit Hard</small></aside>
    <main className="login-panel"><button className="back" onClick={onBack}>← Voltar ao site</button><form className="login-form" onSubmit={submit}><h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2><p>{mode === 'login' ? 'Use seu e-mail e senha.' : 'O cadastro público cria uma conta de aluno.'}</p>
      {mode === 'register' && <><label>Nome completo<input name="name" required /></label><label>Telefone<input name="phone" required placeholder="(81) 99999-9999" /></label></>}
      <label>E-mail<input name="email" type="email" required /></label><label>Senha<input name="password" type="password" minLength={8} required /></label>
      {error && <p className="form-error">{error}</p>}<button className="btn btn-primary full" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar na plataforma' : 'Finalizar cadastro'}</button>
      <button type="button" className="text-btn full" onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Ainda não tenho cadastro' : 'Já tenho uma conta'}</button>
      {mode === 'login' && <small className="demo">Aluno: aluno@spirithard.com / Aluno@123<br/>Professor: aribeiro@spirithard.com / Professor@123</small>}
    </form></main></div>
}

function Dashboard({ user, classes, onLogout, notify }: { user: User; classes: ClassItem[]; onLogout: () => void; notify: (text: string) => void }) {
  return user.role === 'TEACHER'
    ? <TeacherDashboard user={user} onLogout={onLogout} />
    : <StudentDashboard user={user} classes={classes} onLogout={onLogout} notify={notify} />
}

function StudentDashboard({ user, classes, onLogout, notify }: { user: User; classes: ClassItem[]; onLogout: () => void; notify: (text: string) => void }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [checkout, setCheckout] = useState<ClassItem | null>(() => {
    const desired = Number(sessionStorage.getItem('desiredClass'))
    return classes.find(item => item.id === desired && item.available) ?? null
  })
  const load = () => request<{ enrollments: Enrollment[] }>('/student/dashboard').then(value => { setEnrollments(value.enrollments); setError('') }).catch(e => setError(e.message))
  useEffect(() => { sessionStorage.removeItem('desiredClass'); void load() }, [])
  const confirmEnrollment = async () => {
    if (!checkout) throw new Error('Escolha uma turma para continuar.')
    let enrollment: Enrollment
    try {
      enrollment = await request<Enrollment>('/student/enrollments', { method: 'POST', body: JSON.stringify({ classOfferingId: checkout.id }) })
    } catch (reason) {
      if (!(reason instanceof ApiError) || reason.status !== 409) throw reason
      const dashboard = await request<{ enrollments: Enrollment[] }>('/student/dashboard')
      const existing = dashboard.enrollments.find(item => item.classOfferingId === checkout.id && item.status === 'CONFIRMED')
      if (!existing) throw reason
      enrollment = existing
    }
    await load()
    return enrollment
  }
  const cancel = async (id: number) => {
    try { await request(`/student/enrollments/${id}`, { method: 'DELETE' }); await load(); notify('Inscrição cancelada.') }
    catch (e) { notify(e instanceof Error ? e.message : 'Não foi possível cancelar.') }
  }
  if (checkout) return <DashboardShell user={user} onLogout={onLogout}><PaymentDemo key={checkout.id} item={checkout} onBack={() => setCheckout(null)} onConfirm={confirmEnrollment}/></DashboardShell>
  return <DashboardShell user={user} onLogout={onLogout}><div className="stats"><Stat label="Minhas inscrições" value={String(enrollments.length)} detail="Atividades confirmadas"/><Stat label="Turmas disponíveis" value={String(classes.filter(c => c.available).length)} detail="Catálogo Spirit Hard"/></div>
    {error && <p className="form-error">{error}</p>}<section className="panel"><div className="panel-title"><div><span>Minha agenda</span><h3>Atividades inscritas</h3></div></div>{enrollments.length === 0 ? <p>Você ainda não possui inscrições.</p> : <div className="agenda">{enrollments.map(item => <div key={item.id}><b>{item.days}</b><strong>{item.timeRange}</strong><p>{item.className}<small>{item.instructor}</small></p><button className="status red" onClick={() => cancel(item.id)}>Cancelar</button></div>)}</div>}</section>
    <section className="panel class-panel"><div className="panel-title"><div><span>Catálogo</span><h3>Escolha uma nova turma</h3></div></div><ClassList items={classes} action={setCheckout} actionLabel="Inscrever-se" /></section>
  </DashboardShell>
}

function TeacherDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [items, setItems] = useState<TeacherClass[]>([])
  const [error, setError] = useState('')
  useEffect(() => { request<{ classes: TeacherClass[] }>('/teacher/dashboard').then(data => setItems(data.classes)).catch(e => setError(e.message)) }, [])
  const total = items.reduce((sum, item) => sum + item.students.length, 0)
  return <DashboardShell user={user} onLogout={onLogout}><div className="stats"><Stat label="Minhas turmas" value={String(items.length)} detail="Turmas sob sua responsabilidade"/><Stat label="Alunos inscritos" value={String(total)} detail="Somente suas turmas"/></div>
    {error && <p className="form-error">{error}</p>}{items.map(item => <section className="panel" key={item.id}><div className="panel-title"><div><span>{item.days} • {item.timeRange}</span><h3>{item.name}</h3></div><b>{item.students.length} aluno(s)</b></div>{item.students.length === 0 ? <p>Nenhum aluno inscrito nesta turma.</p> : <div className="table-wrap"><table><thead><tr><th>Aluno</th><th>E-mail</th><th>Telefone</th><th>Status</th></tr></thead><tbody>{item.students.map(student => <tr key={student.email}><td><b>{student.name[0]}</b>{student.name}</td><td>{student.email}</td><td>{student.phone}</td><td><span className="status green">{student.status}</span></td></tr>)}</tbody></table></div>}</section>)}
  </DashboardShell>
}

function DashboardShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  return <div className="dashboard"><aside className="sidebar"><button className="brand light-brand"><span>SH</span><strong>Spirit Hard<small>Artes marciais</small></strong></button><nav><a className="active">◦ Visão geral</a><a>▣ {user.role === 'TEACHER' ? 'Minhas turmas' : 'Minhas aulas'}</a></nav><button className="logout" onClick={onLogout}>↪ Sair</button></aside><main className="dash-main"><header><div><h1>Olá, {user.name}!</h1><p>{user.role === 'TEACHER' ? 'Acompanhe as inscrições das suas turmas.' : 'Acompanhe e organize seus treinos.'}</p></div><div className="profile"><span>{user.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><strong>{user.name}</strong><small>{user.role === 'TEACHER' ? 'Professor' : 'Aluno'}</small></div></div></header>{children}</main></div>
}

function ClassList({ items, action, actionLabel }: { items: ClassItem[]; action: (item: ClassItem) => void; actionLabel: string }) {
  return <div className="class-list">{items.map(item => <article key={item.id}><div className="day">{item.modality.slice(0, 3).toUpperCase()}</div><div><strong>{item.timeRange}</strong><small>R$ {Number(item.price).toFixed(2).replace('.', ',')}</small></div><div><h3>{item.name}</h3><p>{item.days} • {item.instructor}{item.note ? ` • ${item.note}` : ''}</p></div><button disabled={!item.available} onClick={() => action(item)}>{item.available ? actionLabel : 'Sem vaga'} →</button></article>)}</div>
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="stat"><span>{label}</span><strong>{value}</strong><small className="good">{detail}</small></article>
}

export default App
