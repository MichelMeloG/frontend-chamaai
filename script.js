document.addEventListener('DOMContentLoaded', () => {
    const serviceList = document.getElementById('service-list');
    const apiUrl = 'http://159.203.179.246:8000/api';

    // Busca e exibe os serviços
    const fetchServices = async () => {
        try {
            // Usaremos o endpoint de serviços, que precisa ser criado na API
            const response = await fetch(`${apiUrl}/services/`);
            const services = await response.json();
            
            serviceList.innerHTML = ''; // Limpa a lista

            if (services.length === 0) {
                serviceList.innerHTML = '<p>Nenhum serviço disponível no momento.</p>';
                return;
            }

            services.forEach(service => {
                const card = document.createElement('div');
                card.className = 'service-card';
                card.innerHTML = `
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                    <strong>Preço: R$ ${service.price}</strong>
                `;
                serviceList.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
            serviceList.innerHTML = '<p>Não foi possível carregar os serviços. A API está online?</p>';
        }
    };

    // Busca inicial dos serviços
    fetchServices();
});