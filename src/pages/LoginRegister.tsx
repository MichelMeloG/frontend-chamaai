import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, apiFetch, readErrorMessage } from '../api'

export function LoginRegister({
  onLogin,
}: {
  onLogin: () => Promise<void>
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const toggle = () => {
    setMessage('')
    setIsRegister((prev) => !prev)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
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
