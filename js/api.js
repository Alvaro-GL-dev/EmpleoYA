// js/api.js
export const API_URL = 'http://localhost:3000/api';

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = 'index.html';
};

// Función global para Toasts
export const showToast = (message, type = "success") => {
    let toastContainer = document.querySelector(".toast-notification") || document.getElementById("liveToast");
    if (!toastContainer) return alert(message);

    const bgClass = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : "bg-warning");
    toastContainer.innerHTML = `
      <div class="toast align-items-center text-white ${bgClass} border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;
    setTimeout(() => { toastContainer.innerHTML = ''; }, 3500);
};