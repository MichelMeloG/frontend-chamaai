import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import type { User } from '../types'
import './Dashboard.css'

interface Contact {
  id: number
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

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadDashboardData = async () => {
      try {
        // Carregar contatos/mensagens
        const response = await apiFetch(`/messages/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setContacts(data || [])
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

  const stats = [
    { label: 'Visitas ao perfil', value: '45', change: '+12%', icon: '👁️' },
    { label: 'Contatos recebidos', value: `${contacts.length}`, change: '+3', icon: '💬' },
    { label: 'Nota média', value: '4.9', change: '127 avaliações', icon: '⭐' },
    { label: 'Receita estimada', value: 'R$2.4k', change: 'este mês', icon: '📈' },
  ]

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-menu">
          <div className="menu-item active">
            <span className="menu-icon">🏠</span>
            <span>Início</span>
          </div>
          <div className="menu-item">
            <span className="menu-icon">💬</span>
            <span>Mensagens</span>
          </div>
          <div className="menu-item">
            <span className="menu-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="menu-item">
            <span className="menu-icon">🔍</span>
            <span>Buscar Profissionais</span>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
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

        {/* My Contacts Section */}
        <div className="contacts-section">
          <h3>Meus Contatos</h3>
          <a href="#" className="view-all">Ver todos ›</a>
          <div className="contacts-list">
            {loading ? (
              <p>Carregando contatos...</p>
            ) : error ? (
              <p style={{ color: '#dc2626' }}>{error}</p>
            ) : contacts.length === 0 ? (
              <p>Nenhum contato ainda</p>
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
      </section>
    </div>
  )
}
