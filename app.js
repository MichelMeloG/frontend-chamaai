// app.js - Lógica principal do Frontend

const apiUrl = 'http://159.203.179.246:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    const token = localStorage.getItem('accessToken');

    // Atualiza a navegação baseada no estado de login
    if (token) {
        navLinks.innerHTML = `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="profile.html">Meu Perfil</a></li>
            <li><a href="#" id="logout-btn">Sair</a></li>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        navLinks.innerHTML = `
            <li><a href="/#services">Serviços</a></li>
            <li><a href="login.html">Login / Registrar</a></li>
        `;
    }

    // Roteamento simples baseado na URL
    const path = window.location.pathname;
    if (path.endsWith('dashboard.html')) {
        loadDashboard();
    } else if (path.endsWith('profile.html')) {
        loadProfile();
    }
});

function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Token inválido ou expirado, desloga o usuário
        logout();
        throw new Error('Unauthorized');
    }
    return response;
}


// Carrega o conteúdo do Dashboard
async function loadDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    try {
        const response = await fetchWithAuth(`${apiUrl}/users/me`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const user = await response.json();

        if (user.type === 'provider') {
            dashboardContent.innerHTML = `
                <h2>Bem-vindo, Prestador ${user.name}!</h2>
                <p>Aqui você pode gerenciar seus serviços, portfólio e solicitações.</p>
                <!-- Adicionar mais funcionalidades aqui -->
            `;
        } else {
            dashboardContent.innerHTML = `
                <h2>Bem-vindo, ${user.name}!</h2>
                <p>Encontre os melhores profissionais para seus projetos.</p>
                <!-- Adicionar mais funcionalidades aqui -->
            `;
        }
    } catch (error) {
        dashboardContent.innerHTML = '<p>Você precisa estar logado para ver esta página.</p>';
    }
}

// Carrega o conteúdo do Perfil
async function loadProfile() {
    const profileContent = document.getElementById('profile-content');
    try {
        const response = await fetchWithAuth(`${apiUrl}/users/me`); // Reutiliza o endpoint
        if (!response.ok) throw new Error('Failed to fetch profile data');

        const user = await response.json();
        
        profileContent.innerHTML = `
            <div><strong>Nome:</strong> ${user.name}</div>
            <div><strong>Email:</strong> ${user.email}</div>
            <div><strong>Tipo de Conta:</strong> ${user.type}</div>
            <br>
            <button>Editar Perfil</button> <!-- Funcionalidade a ser implementada -->
        `;
    } catch (error) {
        profileContent.innerHTML = '<p>Você precisa estar logado para ver seu perfil.</p>';
    }
}