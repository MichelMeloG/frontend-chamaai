import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, apiFetch, readErrorMessage } from '../api'
import './LoginRegister.css'

export function LoginRegister({
  onLogin,
}: {
  onLogin: () => Promise<void>
}) {
  const [isRegister, setIsRegister] = useState(true)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

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
    <section className="login-container">
      <div className="login-card">
        {/* Title */}
        <h2 className="login-title">{isRegister ? 'Crie sua conta' : 'Login'}</h2>
        <p className="login-subtitle">
          {isRegister
            ? 'Cadastre-se e encontre os melhores profissionais'
            : 'Entre com seus dados para acessar'}
        </p>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false)
              setMessage('')
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true)
              setMessage('')
            }}
          >
            Cadastrar
          </button>
        </div>

        {/* Message */}
        {message && <p className="message">{message}</p>}

        {/* Forms */}
        {isRegister ? (
          <form onSubmit={handleRegister} className="login-form">
            <input name="name" type="text" placeholder="Nome" required />
            <input name="email" type="email" placeholder="E-mail" required />
            <input name="cpf" type="text" placeholder="CPF" required />
            <div className="password-input">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <select name="type" required defaultValue="">
              <option value="" disabled>
                Você é...
              </option>
              <option value="client">Cliente</option>
              <option value="provider">Prestador</option>
            </select>
            <button type="submit" className="primary-button">
              Criar conta
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="login-form">
            <input name="email" type="email" placeholder="E-mail" required />
            <div className="password-input">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <button type="submit" className="primary-button">
              Entrar
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
