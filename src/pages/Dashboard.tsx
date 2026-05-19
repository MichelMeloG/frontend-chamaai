import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import type { User, Service } from '../types'
import './Dashboard.css'

interface Contact {
  id: number | string
  name: string
  message: string
  time: string
  avatar?: string
}

export function Dashboard({ user }: { user: User | null }) {
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  
  // States para criação de serviço
  const [userServices, setUserServices] = useState<Service[]>([])
  const [serviceMessage, setServiceMessage] = useState('')
  const [isCreatingService, setIsCreatingService] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const fetchUserServices = async () => {
    if (!user) return
    try {
      const response = await apiFetch(`/services/`)
      if (response.ok) {
        const data: Service[] = await response.json()
        setUserServices(data.filter((s) => s.user_id === user.id) || [])
      }
    } catch (err) {
      console.error('Erro ao buscar serviços do usuário', err)
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadDashboardData = async () => {
      try {
        let messagesData: Contact[] = []
        // Carregar contatos/mensagens
        const msgResponse = await apiFetch(`/messages/${user.id}`)
        if (msgResponse.ok) {
          messagesData = await msgResponse.json() || []
        }

        // Carregar requests como contatos (solicitações)
        let userRequests: any[] = []
        try {
          const rolePath = user.type === 'provider' ? 'professional' : 'client'
          const requestsReq = await apiFetch(`/requests/${rolePath}/${user.id}`)
          if (requestsReq.ok) {
            userRequests = await requestsReq.json()
          }
        } catch(e) {
          console.warn('Falha ao buscar solicitações', e)
        }
        
        const formattedRequests: Contact[] = userRequests.map((req: any) => ({
          id: `req-${req.id}`,
          name: req.client_id === user.id ? `Profissional: ${req.professional_id.split('-')[0]}` : `Cliente: ${req.client_id.split('-')[0]}`,
          message: `[${req.status.toUpperCase()}] ${req.description}`,
          time: 'Recente'
        }))
        
        // Junta as mensagens antigas com as novas solicitações
        setContacts([...messagesData, ...formattedRequests])
        
        // Carregar servicos do usuário
        if (user.type === 'provider') {
          await fetchUserServices()
        }
      } catch (err) {
        setError('Erro ao carregar dados do dashboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (!user) {
    return (
      <section className="container">
        <p>Você precisa estar logado para ver o dashboard.</p>
      </section>
    )
  }

  const handleSaveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      price: Number(formData.get('price')) || 0,
      user_id: user.id,
    }

    try {
      const response = editingService 
        ? await apiFetch(`/services/${editingService.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiFetch('/services/', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      if (response.ok) {
        setServiceMessage(editingService ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!')
        setIsCreatingService(false)
        setEditingService(null)
        await fetchUserServices() // Atualiza a lista após salvar
      } else {
        setServiceMessage('Erro ao salvar o serviço.')
      }
    } catch {
      setServiceMessage('Erro de conexão ao salvar o serviço.')
    }
  }

  const stats = [
    { label: 'Visitas ao perfil', value: '45', change: '+12%', icon: '👁️' },
    { label: 'Contatos recebidos', value: `${contacts.length}`, change: '+3', icon: '💬' },
    { label: 'Nota média', value: '4.9', change: '127 avaliações', icon: '⭐' },
    { label: 'Receita estimada', value: 'R$2.4k', change: 'este mês', icon: '📈' },
  ]

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
          <Link className="active" to="/dashboard">Dashboard</Link>
          <Link to="/services">Buscar Profissionais</Link>
        </nav>
      </aside>

      <section className="home-main">
        <header className="home-topbar">
          <div className="home-search">
             <h2 style={{ margin: 0, fontSize: 18 }}>Dashboard</h2>
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
        {/* Premium Banner */}
        <div className="premium-banner">
          <div className="banner-content">
            <h3>Plano anual Gratuito</h3>
            <p>Quer aparecer 3x mais?</p>
            <p className="banner-subtitle">
              Com o Plano Premium, seu perfil aparece primeiro nas buscas e você recebe mais contatos!
            </p>
            <button className="banner-button">⭐ Conheça o Plano Premium</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Status Section */}
        <div className="status-section">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Status: {isAvailable ? 'Disponível' : 'Indisponível'}</span>
          </div>
          <button
            className="status-toggle"
            onClick={() => setIsAvailable(!isAvailable)}
          >
            Alterar
          </button>
        </div>
        
        {/* Services Section */}
        {user?.type === 'provider' && (
          <div className="contacts-section" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Meus Serviços Ofertados</h3>
              <button
                type="button"
                className="banner-button"
                style={{ width: 'auto', background: 'var(--primary)', color: 'white' }}
                onClick={() => {
                  setEditingService(null);
                  setIsCreatingService(!isCreatingService);
                  setServiceMessage('');
                }}
              >
                {isCreatingService || editingService ? 'Cancelar' : '+ Novo Serviço'}
              </button>
            </div>
            
            {serviceMessage && <p className="message" style={{ marginTop: 10, color: '#10b981' }}>{serviceMessage}</p>}
            
            {(isCreatingService || editingService) && (
              <form onSubmit={handleSaveService} className="modal-form" style={{ marginTop: 20, background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div className="form-group">
                  <label htmlFor="title">Título do Serviço</label>
                  <input type="text" name="title" id="title" placeholder="Ex: Conserto de Encanamento" required defaultValue={editingService?.title || ''} />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Descrição</label>
                  <textarea name="description" id="description" rows={3} placeholder="Detalhes sobre sua especialidade e o que você inclui no serviço..." required defaultValue={editingService?.description || ''}></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="price">Preço Base (R$)</label>
                  <input type="number" name="price" id="price" placeholder="Ex: 80" step="0.01" required defaultValue={editingService?.price || ''} />
                </div>
                
                <button type="submit" style={{ marginTop: 10 }}>Salvar Serviço</button>
              </form>
            )}

            {!isCreatingService && !editingService && (
              <div className="contacts-list" style={{ marginTop: 16 }}>
                {userServices.length === 0 ? (
                  <p>Você ainda não cadastrou nenhum serviço.</p>
                ) : (
                  userServices.map((service) => (
                    <div key={service.id} className="contact-item" style={{ alignItems: 'flex-start' }}>
                      <div className="contact-info">
                        <div className="contact-name">{service.title}</div>
                        <div className="contact-message">{service.description}</div>
                      </div>
                      <div className="contact-time" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          R$ {service.price}
                        </span>
                        <button
                          type="button"
                          className="link-button"
                          style={{ padding: '4px 8px', fontSize: 12, background: 'var(--primary-ghost)', color: 'var(--primary)' }}
                          onClick={() => {
                            setEditingService(service);
                            setServiceMessage('');
                          }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* My Contacts Section */}
        <div className="contacts-section">
          <h3>Suas Mensagens e Solicitações</h3>
          <a href="#" className="view-all">Ver todos ›</a>
          <div className="contacts-list">
            {loading ? (
              <p>Carregando registros...</p>
            ) : error ? (
              <p style={{ color: '#dc2626' }}>{error}</p>
            ) : contacts.length === 0 ? (
              <p>Nenhuma solicitação ou mensagem no momento.</p>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="contact-item">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} />
                  ) : (
                    <div className="contact-avatar">{contact.name.charAt(0)}</div>
                  )}
                  <div className="contact-info">
                    <div className="contact-name">{contact.name}</div>
                    <div className="contact-message">{contact.message}</div>
                  </div>
                  <div className="contact-time">{contact.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </section>
    </div>
  )
}
