import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { apiFetch, readErrorMessage } from '../api'
import type { MessageItem, RequestItem, User } from '../types'

export function Dashboard({ user }: { user: User | null }) {
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

  const handleCreateService = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleLoadConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    const formData = new FormData(event.currentTarget)
    const targetId = String(formData.get('targetId') || '').trim()
    if (!targetId) return
    const response = await apiFetch(`/messages/${user.id}/${targetId}`)
    const data = (await response.json()) as MessageItem[]
    setConversation(data || [])
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
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
