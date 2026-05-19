import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from './api'
import { Navbar } from './components/Navbar'
import { Dashboard, Home, LoginRegister, Profile, Services } from './pages'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const isAppShell = location.pathname === '/services' || location.pathname === '/dashboard'

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
      {!isAppShell && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services user={user} />} />
        <Route path="/login" element={<LoginRegister onLogin={refreshUser} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/profile" element={<Profile user={user} onProfileUpdate={refreshUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAppShell && <footer className="container footer">&copy; 2026 ChamaAi</footer>}
    </>
  )
}

export default App
