import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { apiFetch, readErrorMessage } from '../api'
import type { ProfileData, User } from '../types'

export function Profile({
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
