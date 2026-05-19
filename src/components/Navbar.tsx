import { Link } from 'react-router-dom'
import type { User } from '../types'

export function Navbar({
  user,
  onLogout,
}: {
  user: User | null
  onLogout: () => void
}) {
  return (
    <header>
      <nav className="nav">
        <Link className="logo" to="/">
          🔵 ObraLink
        </Link>
        <div className="nav-links">
          <Link to="/">Início</Link>
          <Link to="/services">Serviços</Link>
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
