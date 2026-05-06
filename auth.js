document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    const apiUrl = 'http://159.203.179.246:8000/api';

    // Alternar entre formulários
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Lógica de Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const type = document.getElementById('registerType').value;

        try {
            const response = await fetch(`${apiUrl}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, type }),
            });

        if (response.ok) {
            alert('Registro bem-sucedido!');
        } else {
            const error = await response.json();
            alert(`Erro no registro: ${error.detail}`);
        }
        } catch (error) {
            alert('Falha ao conectar com a API.');
            console.error('Erro no registro:', error);
        }
    });

document.addEventListener('DOMContentLoaded', () => {
    // ... (código para alternar formulários) ...

    // Lógica de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Prepara os dados no formato x-www-form-urlencoded
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await fetch(`${apiUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.access_token);
                window.location.href = 'dashboard.html'; // Redireciona para o painel
            } else {
                alert('Email ou senha inválidos.');
            }
        } catch (error) {
            alert('Falha ao tentar fazer login.');
            console.error('Erro no login:', error);
        }
    });
});
});
