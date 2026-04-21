import { API_URL, showToast } from './api.js';

const checkSession = () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const navAuth = document.getElementById('navAuthButtons');
    
    if (!navAuth) return;

    if (token) {
        const url = rol === 'EMPRESA' ? 'empresa.html' : 'candidato-dashboard.html';
        navAuth.innerHTML = `
            <a href="${url}" class="btn btn-primary rounded-pill px-4 fw-bold">Mi Panel</a>
            <button class="btn btn-outline-danger rounded-pill ms-2" id="btnLogoutNav">Salir</button>
        `;
        document.getElementById('btnLogoutNav')?.addEventListener('click', logout);
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary rounded-pill px-4 fw-bold border-2">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Registrarse</a>
        `;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    
    console.log("Login JS listo");
});

const login = async (e, emailId, passwordId) => {
    e.preventDefault();
    const email = document.getElementById(emailId).value;
    const password = document.getElementById(passwordId).value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo_electronico: email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('rol', data.usuario.rol);
            
            showToast('¡Bienvenido a EmpleoYA!', 'success');
            
            setTimeout(() => {
                const rol = data.usuario.rol;
                
                if (rol === 'ADMINISTRADOR') {
                    window.location.href = 'admin-dashboard.html';
                } else if (rol === 'EMPRESA') {
                    window.location.href = 'empresa.html';
                } else {
                    window.location.href = 'candidato-dashboard.html';
                }
            }, 1000);

        } else {
            showToast(data.error || 'Credenciales incorrectas', 'danger');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'danger');
    }
};

document.getElementById('loginCandidatoForm')?.addEventListener('submit', (e) => login(e, 'candidatoEmail', 'candidatoPassword'));
document.getElementById('loginEmpresaForm')?.addEventListener('submit', (e) => login(e, 'empresaEmail', 'empresaPassword'));