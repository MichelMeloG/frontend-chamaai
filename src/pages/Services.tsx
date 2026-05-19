import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { apiFetch, readErrorMessage } from '../api'
import type { Service, User } from '../types'

export function Services({ user }: { user: User | null }) {
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
