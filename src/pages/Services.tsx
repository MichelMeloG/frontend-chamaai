import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, readErrorMessage } from '../api'
import type { Service, User } from '../types'

const CATEGORIES = [
  { label: 'Eletrica', icon: '⚡' },
  { label: 'Hidraulica', icon: '🔧' },
  { label: 'Pintura', icon: '🎨' },
  { label: 'Pedreiro', icon: '🧱' },
  { label: 'Marcenaria', icon: '🚪' },
  { label: 'Gesseiro', icon: '🏗️' },
  { label: 'Serralheiro', icon: '🔩' },
  { label: 'Paisagismo', icon: '🌿' },
]

export function Services({ user }: { user: User | null }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Service | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
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

  const filteredServices = selectedCategory
    ? services.filter(
        (s) =>
          s.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          s.description.toLowerCase().includes(selectedCategory.toLowerCase()),
      )
    : services

  return (
    <div className="home-shell">
      <aside className="home-sidebar">
        <div className="home-brand">
          <span className="brand-dot" aria-hidden="true" />
          ObraLink
        </div>
        <nav className="home-nav">
          <Link to="/">Inicio</Link>
          <Link to="/#">Mensagens</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link className="active" to="/services">
            Buscar Profissionais
          </Link>
        </nav>
      </aside>

      <section className="home-main">
        <header className="home-topbar">
          <div className="home-search">
            <input
              type="search"
              placeholder="Buscar encanador, pedreiro..."
              aria-label="Buscar profissionais"
            />
          </div>
          <div className="home-actions">
            <button className="icon-button" type="button" aria-label="Notificacoes">
              <span className="ping" />
            </button>
            <div className="avatar" aria-label="Perfil">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        <div className="home-content">
          <div className="tabs">
            <button type="button" className="tab active">
              Servicos Rapidos
            </button>
            <button type="button" className="tab">
              Grandes Obras
            </button>
          </div>

          <div className="section-head">
            <h3>Categorias</h3>
            <Link to="/services" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14 }}>
              Ver todas
            </Link>
          </div>
          <div className="category-row">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.label
              return (
                <button
                  key={cat.label}
                  type="button"
                  className="category-card"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                  style={isSelected ? { borderColor: 'var(--primary)', background: 'var(--primary-ghost)' } : {}}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          <div className="section-head">
            <h3>Profissionais na sua Regiao</h3>
            <span style={{ background: 'var(--primary-ghost)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 'bold' }}>
              {filteredServices.length} disponiveis
            </span>
          </div>

          {message && <p className="message">{message}</p>}
          {loading ? (
            <p>Carregando servicos...</p>
          ) : (
            <div className="pro-grid">
              {filteredServices.length === 0 && <p>Nenhum servico encontrado.</p>}
              {filteredServices.map((service) => (
                <div className="pro-card" key={service.id}>
                  <div className="pro-head">
                    <div className="avatar" style={{ background: '#ddd', color: '#333' }}>
                      P
                    </div>
                    <div className="pro-meta">
                      <h4>Profissional ({service.user_id.split('-')[0]})</h4>
                      <p>{service.title}</p>
                    </div>
                    <div className="pro-rating">
                      <span style={{ color: '#f5b400' }}>★</span> 4.5 <span style={{ color: 'var(--text-muted)' }}>(12)</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {service.description.substring(0, 100)}...
                  </div>
                  <div className="chip-row">
                    <span className="chip">R$ {service.price}</span>
                  </div>
                  <button type="button" onClick={() => setSelected(service)} style={{ marginTop: 10 }}>
                    Solicitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="modal-overlay" onClick={() => setSelected(null)}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Solicitar: {selected.title}</h3>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setSelected(null)}
                    aria-label="Fechar"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleRequest} className="modal-form">
                  <input
                    name="professionalId"
                    type="hidden"
                    value={selected.user_id}
                  />

                  <div className="form-group">
                    <label htmlFor="urgency">Nível de Urgência</label>
                    <select name="urgency" id="urgency" defaultValue="media" required>
                      <option value="baixa">Baixa (Pode esperar alguns dias)</option>
                      <option value="media">Média (Ideal para esta semana)</option>
                      <option value="alta">Alta (O mais rápido possível)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Detalhes do problema/serviço</label>
                    <textarea
                      name="description"
                      id="description"
                      placeholder="Descreva o que você precisa com o máximo de detalhes possível..."
                      rows={4}
                      required
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="photo">Link da Foto (Opcional)</label>
                    <input
                      name="photo"
                      id="photo"
                      type="url"
                      placeholder="Ex: https://imgur.com/minha-foto.jpg"
                    />
                  </div>

                  <div className="button-row" style={{ marginTop: '8px' }}>
                    <button type="submit" style={{ flex: 1 }}>
                      Confirmar Solicitação
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setSelected(null)}
                      style={{ flex: 1 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
