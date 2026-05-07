const API_BASE = 'http://159.203.179.246:8000/api';

const { useEffect, useState } = React;

function apiFetch(path, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${path}`, { ...options, headers });
}

function useHashRoute() {
    const getRoute = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) return hash;

        const path = window.location.pathname.toLowerCase();
        if (path.endsWith('login.html')) return 'login';
        if (path.endsWith('dashboard.html')) return 'dashboard';
        if (path.endsWith('profile.html')) return 'profile';
        return 'home';
    };

    const [route, setRoute] = useState(getRoute());

    useEffect(() => {
        const onHashChange = () => setRoute(getRoute());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    return [route, setRoute];
}

function Navbar({ user, onLogout }) {
    return (
        <header>
            <nav className="container nav">
                <a className="logo" href="index.html">ChamaAi</a>
                <div className="nav-links">
                    <a href="#home">Inicio</a>
                    <a href="#services">Servicos</a>
                    {user ? (
                        <>
                            <a href="#dashboard">Dashboard</a>
                            <a href="#profile">Perfil</a>
                            <button type="button" className="link-button" onClick={onLogout}>Sair</button>
                        </>
                    ) : (
                        <a href="#login">Login</a>
                    )}
                </div>
            </nav>
        </header>
    );
}

function LoginRegister({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [message, setMessage] = useState('');

    const toggle = () => {
        setMessage('');
        setIsRegister((prev) => !prev);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setMessage('');

        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_BASE}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!response.ok) {
                setMessage('Email ou senha invalidos.');
                return;
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.access_token);
            onLogin();
            window.location.hash = '#dashboard';
        } catch (error) {
            setMessage('Falha ao tentar fazer login.');
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setMessage('');

        const form = event.target;
        const payload = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value,
            type: form.type.value,
        };

        try {
            const response = await apiFetch('/users/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                setMessage(error.detail || 'Erro ao registrar.');
                return;
            }

            setIsRegister(false);
            setMessage('Registro feito. Entre com seu email e senha.');
        } catch (error) {
            setMessage('Falha ao conectar com a API.');
        }
    };

    return (
        <section className="container">
            <div className="card">
                <h2>{isRegister ? 'Criar Conta' : 'Login'}</h2>
                {message && <p className="message">{message}</p>}
                {isRegister ? (
                    <form onSubmit={handleRegister}>
                        <input name="name" type="text" placeholder="Nome completo" required />
                        <input name="email" type="email" placeholder="Email" required />
                        <input name="password" type="password" placeholder="Senha" required />
                        <select name="type" required defaultValue="">
                            <option value="" disabled>Voce e...</option>
                            <option value="client">Cliente</option>
                            <option value="provider">Prestador</option>
                        </select>
                        <button type="submit">Registrar</button>
                        <button type="button" className="secondary" onClick={toggle}>Ja tem conta? Login</button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin}>
                        <input name="email" type="email" placeholder="Email" required />
                        <input name="password" type="password" placeholder="Senha" required />
                        <button type="submit">Entrar</button>
                        <button type="button" className="secondary" onClick={toggle}>Criar conta</button>
                    </form>
                )}
            </div>
        </section>
    );
}

function Services({ user }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let isMounted = true;
        apiFetch('/services/')
            .then((response) => response.json())
            .then((data) => {
                if (isMounted) {
                    setServices(data || []);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setMessage('Nao foi possivel carregar os servicos.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleRequest = async (event) => {
        event.preventDefault();
        if (!user) {
            setMessage('Faça login para enviar solicitacoes.');
            return;
        }

        const form = event.target;
        const description = `Servico: ${selected?.title || ''}\nUrgencia: ${form.urgency.value}\nDescricao: ${form.description.value}\nFoto: ${form.photo.value || 'N/A'}`;
        const payload = {
            description,
            status: 'novo',
            client_id: user.id,
            professional_id: Number(form.professionalId.value),
        };

        try {
            const response = await apiFetch('/requests/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                setMessage(error.detail || 'Falha ao criar solicitacao.');
                return;
            }

            setMessage('Solicitacao enviada com sucesso.');
            setSelected(null);
            form.reset();
        } catch (error) {
            setMessage('Falha ao conectar com a API.');
        }
    };

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
                            <p><strong>Preco:</strong> R$ {service.price}</p>
                            <p><strong>Prestador:</strong> {service.user_id}</p>
                            <button type="button" onClick={() => setSelected(service)}>Solicitar</button>
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="card">
                    <h3>Solicitar {selected.title}</h3>
                    <form onSubmit={handleRequest}>
                        <input name="professionalId" type="hidden" value={selected.user_id} />
                        <select name="urgency" defaultValue="media" required>
                            <option value="baixa">Baixa</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                        <textarea name="description" placeholder="Descreva o problema" rows="4" required></textarea>
                        <input name="photo" type="url" placeholder="Link da foto (opcional)" />
                        <div className="button-row">
                            <button type="submit">Enviar solicitacao</button>
                            <button type="button" className="secondary" onClick={() => setSelected(null)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}

function Dashboard({ user }) {
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversation, setConversation] = useState([]);

    useEffect(() => {
        if (!user) return;
        const endpoint = user.type === 'provider' ? `/requests/professional/${user.id}` : `/requests/client/${user.id}`;
        apiFetch(endpoint)
            .then((response) => response.json())
            .then((data) => setRequests(data || []))
            .catch(() => setMessage('Nao foi possivel carregar solicitacoes.'))
            .finally(() => setLoading(false));
    }, [user]);

    const handleCreateService = async (event) => {
        event.preventDefault();
        if (!user || user.type !== 'provider') return;
        const form = event.target;
        const payload = {
            title: form.title.value.trim(),
            description: form.description.value.trim(),
            price: Number(form.price.value),
            user_id: user.id,
        };

        try {
            const response = await apiFetch('/services/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json();
                setMessage(error.detail || 'Falha ao criar servico.');
                return;
            }
            setMessage('Servico criado.');
            form.reset();
        } catch (error) {
            setMessage('Falha ao conectar com a API.');
        }
    };

    const handleLoadConversation = async (event) => {
        event.preventDefault();
        if (!user) return;
        const targetId = event.target.targetId.value;
        if (!targetId) return;
        const response = await apiFetch(`/messages/${user.id}/${targetId}`);
        const data = await response.json();
        setConversation(data || []);
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!user) return;
        const form = event.target;
        const payload = {
            sender_id: user.id,
            receiver_id: Number(form.receiverId.value),
            content: form.content.value.trim(),
        };
        if (!payload.receiver_id || !payload.content) return;

        try {
            const response = await apiFetch('/messages/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json();
                setMessage(error.detail || 'Falha ao enviar mensagem.');
                return;
            }
            form.reset();
            setMessage('Mensagem enviada.');
        } catch (error) {
            setMessage('Falha ao conectar com a API.');
        }
    };

    if (!user) {
        return (
            <section className="container">
                <p>Voce precisa estar logado para ver o dashboard.</p>
            </section>
        );
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
                        <textarea name="description" placeholder="Descricao" rows="3" required></textarea>
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
                    <input name="targetId" type="number" placeholder="ID do usuario" required />
                    <button type="submit">Carregar conversa</button>
                </form>
                {conversation.length > 0 && (
                    <div className="chat">
                        {conversation.map((msg) => (
                            <div key={msg.id} className={msg.sender_id === user.id ? 'chat-me' : 'chat-them'}>
                                <span>{msg.content}</span>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSendMessage}>
                    <input name="receiverId" type="number" placeholder="ID do destinatario" required />
                    <input name="content" type="text" placeholder="Mensagem" required />
                    <button type="submit">Enviar</button>
                </form>
            </div>
        </section>
    );
}

function Profile({ user, onProfileUpdate }) {
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) return;
        apiFetch(`/profiles/user/${user.id}`)
            .then((response) => {
                if (!response.ok) return null;
                return response.json();
            })
            .then((data) => {
                if (data) setProfile(data);
            })
            .catch(() => setMessage('Nao foi possivel carregar o perfil.'));
    }, [user]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) return;
        const form = event.target;
        const payload = {
            bio: form.bio.value.trim(),
            category: form.category.value.trim(),
            rating: form.rating.value ? Number(form.rating.value) : null,
            user_id: user.id,
        };

        try {
            const response = profile
                ? await apiFetch(`/profiles/${profile.id}`, {
                      method: 'PUT',
                      body: JSON.stringify(payload),
                  })
                : await apiFetch('/profiles/', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                  });

            if (!response.ok) {
                const error = await response.json();
                setMessage(error.detail || 'Falha ao salvar perfil.');
                return;
            }

            const data = await response.json();
            setProfile(data);
            setMessage('Perfil atualizado.');
            onProfileUpdate();
        } catch (error) {
            setMessage('Falha ao conectar com a API.');
        }
    };

    if (!user) {
        return (
            <section className="container">
                <p>Voce precisa estar logado para ver o perfil.</p>
            </section>
        );
    }

    return (
        <section className="container" id="profile">
            <h2>Meu perfil</h2>
            {message && <p className="message">{message}</p>}
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <textarea name="bio" placeholder="Bio" rows="3" defaultValue={profile?.bio || ''}></textarea>
                    <input name="category" type="text" placeholder="Categoria" defaultValue={profile?.category || ''} />
                    <input name="rating" type="number" step="0.1" placeholder="Rating" defaultValue={profile?.rating || ''} />
                    <button type="submit">Salvar</button>
                </form>
            </div>
        </section>
    );
}

function Home() {
    return (
        <section className="container" id="home">
            <div className="hero card">
                <h1>Encontre o profissional certo</h1>
                <p>Busca rapida por servicos e profissionais.</p>
                <a className="cta" href="#services">Ver servicos</a>
            </div>
        </section>
    );
}

function App() {
    const [route] = useHashRoute();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setUser(null);
            setLoadingUser(false);
            return;
        }

        try {
            const response = await apiFetch('/users/me');
            if (!response.ok) {
                localStorage.removeItem('accessToken');
                setUser(null);
                return;
            }
            const data = await response.json();
            setUser(data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.hash = '#login';
    };

    if (loadingUser) {
        return <p className="container">Carregando...</p>;
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            {route === 'login' && <LoginRegister onLogin={refreshUser} />}
            {route === 'dashboard' && <Dashboard user={user} />}
            {route === 'profile' && <Profile user={user} onProfileUpdate={refreshUser} />}
            {route === 'home' && <Home />}
            {(route === 'services' || route === 'home') && <Services user={user} />}
            {!['login', 'dashboard', 'profile', 'services', 'home'].includes(route) && <Home />}
            <footer className="container footer">&copy; 2026 ChamaAi</footer>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);