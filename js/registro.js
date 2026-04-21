import { API_URL, showToast, logout } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
});

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
        // Usamos la función logout importada
        document.getElementById('btnLogoutNav')?.addEventListener('click', logout);
    } else {
        // Esto sustituye el spinner por los botones de acceso
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary rounded-pill px-4 fw-bold border-2">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Registrarse</a>
        `;
    }
};

const registro = async (e, role) => {
    e.preventDefault();
    
    const prefix = role === 'CANDIDATO' ? 'candidato' : 'empresa';
    
    const nombre = document.getElementById(`${prefix}Nombre`).value;
    const email = document.getElementById(`${prefix}Email`).value;
    const password = document.getElementById(`${prefix}Password`).value;
    const confirm = document.getElementById(`${prefix}ConfirmPassword`).value;
    const terms = document.getElementById(`terms${role === 'CANDIDATO' ? 'Candidato' : 'Empresa'}`).checked;

    if (password !== confirm) return showToast("Las contraseñas no coinciden", "danger");
    if (!terms) return showToast("Debes aceptar los términos", "warning");

    try {
        const response = await fetch(`${API_URL}/registro`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                rol: role, 
                nombre: nombre, 
                correo_electronico: email, 
                password: password 
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('¡Cuenta creada exitosamente!', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showToast(data.error || 'Error al registrar', 'danger');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'danger');
    }
};

document.getElementById('registerCandidatoForm')?.addEventListener('submit', (e) => registro(e, 'CANDIDATO'));
document.getElementById('registerEmpresaForm')?.addEventListener('submit', (e) => registro(e, 'EMPRESA'));