import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

type UserType = 'client' | 'provider'

interface User {
  id: string
  name: string
  email: string
  cpf: string
  type: UserType
}

interface Service {
  id: string
  title: string
  description: string
  price: number
  user_id: string
}

interface RequestItem {
  id: string
  description: string
  status: string
}

interface MessageItem {
  id: string
  sender_id: string
  receiver_id: string
  content: string
}

interface ProfileData {
  id: string
  bio: string | null
  category: string | null
  rating: number | null
  user_id: string
}

type ApiDetail =
  | string
  | { msg?: string }
  | Array<string | { msg?: string }>
  | null
  | undefined

function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers })
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = (await response.json()) as { detail?: ApiDetail }
    const detail = data?.detail
    if (!detail) return fallbackMessage
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === 'string' ? item : item?.msg || 'Erro'))
        .join(' | ')
    }
    if (typeof detail === 'object') return detail.msg || fallbackMessage
    return String(detail)
  } catch (error) {
    return fallbackMessage
  }
}

function Navbar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <header>
      <nav className="container nav">
        <Link className="logo" to="/">
          ChamaAi
        </Link>
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/services">Servicos</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/profile">Perfil</Link>
              <button type="button" className="link-button" onClick={onLogout}>
                Sair
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function LoginRegister({ onLogin }: { onLogin: () => Promise<void> }) {
  const [isRegister, setIsRegister] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const toggle = () => {
    setMessage('')
    setIsRegister((prev) => !prev)
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    const payload = new URLSearchParams()
    payload.append('username', email)
    payload.append('password', password)

    try {
      const response = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
      })

      if (!response.ok) {
        setMessage('Email ou senha invalidos.')
        return
      }

      const data = (await response.json()) as { access_token: string }
      localStorage.setItem('accessToken', data.access_token)
      await onLogin()
      navigate('/dashboard')
    } catch (error) {
      setMessage('Falha ao tentar fazer login.')
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      cpf: String(formData.get('cpf') || '').trim(),
      password: String(formData.get('password') || ''),
      type: String(formData.get('type') || ''),
    }

    try {
      const response = await apiFetch('/users/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await readErrorMessage(response, 'Erro ao registrar.')
        setMessage(errorMessage)
        return
      }

      setIsRegister(false)
      setMessage('Registro feito. Entre com seu email e senha.')
    } catch (error) {
      setMessage('Falha ao conectar com a API.')
    }
  }

  return (
    <section className="container">
      <div className="card">
        <h2>{isRegister ? 'Criar Conta' : 'Login'}</h2>
        {message && <p className="message">{message}</p>}
        {isRegister ? (
          <form onSubmit={handleRegister}>
            <input name="name" type="text" placeholder="Nome completo" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="cpf" type="text" placeholder="CPF" required />
            <input name="password" type="password" placeholder="Senha" required />
            <select name="type" required defaultValue="">
              <option value="" disabled>
                Voce e...
              </option>
              <option value="client">Cliente</option>
              <option value="provider">Prestador</option>
            </select>
            <button type="submit">Registrar</button>
            <button type="button" className="secondary" onClick={toggle}>
              Ja tem conta? Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Senha" required />
            <button type="submit">Entrar</button>
            <button type="button" className="secondary" onClick={toggle}>
              Criar conta
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function Services({ user }: { user: User | null }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Service | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    apiFetch('/services/')
      .then((response) => response.json())
      .then((data: Service[]) => {
        if (isMounted) {
          setServices(data || [])
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage('Nao foi possivel carregar os servicos.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setMessage('Faca login para enviar solicitacoes.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const description = `Servico: ${selected?.title || ''}\nUrgencia: ${String(
      formData.get('urgency') || '',
    )}\nDescricao: ${String(formData.get('description') || '')}\nFoto: ${String(
      formData.get('photo') || 'N/A',
    )}`
    const payload = {
      description,
      status: 'novo',
      client_id: user.id,
      professional_id: String(formData.get('professionalId') || ''),
    }

    try {
      const response = await apiFetch('/requests/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await readErrorMessage(
          response,
          'Falha ao criar solicitacao.',
        )
        setMessage(errorMessage)
        return
      }

      setMessage('Solicitacao enviada com sucesso.')
      setSelected(null)
      form.reset()
    } catch (error) {
      setMessage('Falha ao conectar com a API.')
    }
  }

  return (
    <section className="container" id="services">
      <h2>Servicos</h2>
      {message && <p className="message">{message}</p>}
      {loading ? (
        <p>Carregando servicos...</p>
      ) : (
        <div className="service-grid">
          {services.length === 0 && <p>Nenhum servico encontrado.</p>}
          {services.map((service) => (
            <div className="card" key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p>
                <strong>Preco:</strong> R$ {service.price}
              </p>
              <p>
                <strong>Prestador:</strong> {service.user_id}
              </p>
              <button type="button" onClick={() => setSelected(service)}>
                Solicitar
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card">
          <h3>Solicitar {selected.title}</h3>
          <form onSubmit={handleRequest}>
            <input
              name="professionalId"
              type="hidden"
              value={selected.user_id}
            />
            <select name="urgency" defaultValue="media" required>
              <option value="baixa">Baixa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <textarea
              name="description"
              placeholder="Descreva o problema"
              rows={4}
              required
            ></textarea>
            <input name="photo" type="url" placeholder="Link da foto (opcional)" />
            <div className="button-row">
              <button type="submit">Enviar solicitacao</button>
              <button type="button" className="secondary" onClick={() => setSelected(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function Dashboard({ user }: { user: User | null }) {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<MessageItem[]>([])

  useEffect(() => {
    if (!user) return
    const endpoint =
      user.type === 'provider'
        ? `/requests/professional/${user.id}`
        : `/requests/client/${user.id}`
    apiFetch(endpoint)
      .then((response) => response.json())
      .then((data: RequestItem[]) => setRequests(data || []))
      .catch(() => setMessage('Nao foi possivel carregar solicitacoes.'))
      .finally(() => setLoading(false))
  }, [user])

  const handleCreateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || user.type !== 'provider') return
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      price: Number(formData.get('price') || 0),
      user_id: user.id,
    }

    try {
      const response = await apiFetch('/services/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorMessage = await readErrorMessage(response, 'Falha ao criar servico.')
        setMessage(errorMessage)
        return
      }
      setMessage('Servico criado.')
      form.reset()
    } catch (error) {
      setMessage('Falha ao conectar com a API.')
    }
  }

  const handleLoadConversation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    if (!user) return
    const formData = new FormData(event.currentTarget)
    const targetId = String(formData.get('targetId') || '').trim()
    if (!targetId) return
    const response = await apiFetch(`/messages/${user.id}/${targetId}`)
    const data = (await response.json()) as MessageItem[]
    setConversation(data || [])
  }

  const handleSendMessage = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    if (!user) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      sender_id: user.id,
      receiver_id: String(formData.get('receiverId') || ''),
      content: String(formData.get('content') || '').trim(),
    }
    if (!payload.receiver_id || !payload.content) return

    try {
      const response = await apiFetch('/messages/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorMessage = await readErrorMessage(response, 'Falha ao enviar mensagem.')
        setMessage(errorMessage)
        return
      }
      form.reset()
      setMessage('Mensagem enviada.')
    } catch (error) {
      setMessage('Falha ao conectar com a API.')
    }
  }

  if (!user) {
    return (
      <section className="container">
        <p>Voce precisa estar logado para ver o dashboard.</p>
      </section>
    )
  }

  return (
    <section className="container" id="dashboard">
      <h2>Dashboard</h2>
      <p>Ola, {user.name}</p>
      {message && <p className="message">{message}</p>}

      {user.type === 'provider' && (
        <div className="card">
          <h3>Criar servico</h3>
          <form onSubmit={handleCreateService}>
            <input name="title" type="text" placeholder="Titulo" required />
            <textarea name="description" placeholder="Descricao" rows={3} required></textarea>
            <input name="price" type="number" step="0.01" placeholder="Preco" required />
            <button type="submit">Salvar</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Solicitacoes</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <ul className="list">
            {requests.length === 0 && <li>Nenhuma solicitacao.</li>}
            {requests.map((item) => (
              <li key={item.id}>
                <strong>Status:</strong> {item.status} <br />
                <span>{item.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Mensagens</h3>
        <form onSubmit={handleLoadConversation}>
          <input name="targetId" type="text" placeholder="ID do usuario" required />
          <button type="submit">Carregar conversa</button>
        </form>
        {conversation.length > 0 && (
          <div className="chat">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={msg.sender_id === user.id ? 'chat-me' : 'chat-them'}
              >
                <span>{msg.content}</span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage}>
          <input name="receiverId" type="text" placeholder="ID do destinatario" required />
          <input name="content" type="text" placeholder="Mensagem" required />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </section>
  )
}

function Profile({
  user,
  onProfileUpdate,
}: {
  user: User | null
  onProfileUpdate: () => Promise<void>
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    apiFetch(`/profiles/user/${user.id}`)
      .then((response) => {
        if (!response.ok) return null
        return response.json()
      })
      .then((data: ProfileData | null) => {
        if (data) setProfile(data)
      })
      .catch(() => setMessage('Nao foi possivel carregar o perfil.'))
  }, [user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    const formData = new FormData(event.currentTarget)
    const payload = {
      bio: String(formData.get('bio') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      rating: formData.get('rating') ? Number(formData.get('rating')) : null,
      user_id: user.id,
    }

    try {
      const response = profile
        ? await apiFetch(`/profiles/${profile.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiFetch('/profiles/', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      if (!response.ok) {
        const errorMessage = await readErrorMessage(response, 'Falha ao salvar perfil.')
        setMessage(errorMessage)
        return
      }

      const data = (await response.json()) as ProfileData
      setProfile(data)
      setMessage('Perfil atualizado.')
      await onProfileUpdate()
    } catch (error) {
      setMessage('Falha ao conectar com a API.')
    }
  }

  if (!user) {
    return (
      <section className="container">
        <p>Voce precisa estar logado para ver o perfil.</p>
      </section>
    )
  }

  return (
    <section className="container" id="profile">
      <h2>Meu perfil</h2>
      {message && <p className="message">{message}</p>}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <textarea
            name="bio"
            placeholder="Bio"
            rows={3}
            defaultValue={profile?.bio || ''}
          ></textarea>
          <input
            name="category"
            type="text"
            placeholder="Categoria"
            defaultValue={profile?.category || ''}
          />
          <input
            name="rating"
            type="number"
            step="0.1"
            placeholder="Rating"
            defaultValue={profile?.rating ?? ''}
          />
          <button type="submit">Salvar</button>
        </form>
      </div>
    </section>
  )
}

function Home({ user }: { user: User | null }) {
  return (
    <>
      <section className="container" id="home">
        <div className="hero card">
          <h1>Encontre o profissional certo</h1>
          <p>Busca rapida por servicos e profissionais.</p>
          <Link className="cta" to="/services">
            Ver servicos
          </Link>
        </div>
      </section>
      <Services user={user} />
    </>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const navigate = useNavigate()

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setLoadingUser(false)
      return
    }

    try {
      const response = await apiFetch('/users/me')
      if (!response.ok) {
        localStorage.removeItem('accessToken')
        setUser(null)
        return
      }
      const data = (await response.json()) as User
      setUser(data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
    navigate('/login')
  }

  if (loadingUser) {
    return <p className="container">Carregando...</p>
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/services" element={<Home user={user} />} />
        <Route path="/login" element={<LoginRegister onLogin={refreshUser} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/profile" element={<Profile user={user} onProfileUpdate={refreshUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="container footer">&copy; 2026 ChamaAi</footer>
    </>
  )
}

export default App
