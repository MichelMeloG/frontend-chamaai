import { Link } from 'react-router-dom'

export function Home() {
  return (
    <section className="container" id="home">
      <div className="hero card">
        <h1>Encontre o profissional certo</h1>
        <p>Busca rapida por servicos e profissionais.</p>
        <Link className="cta" to="/services">
          Ver servicos
        </Link>
      </div>
    </section>
  )
}
