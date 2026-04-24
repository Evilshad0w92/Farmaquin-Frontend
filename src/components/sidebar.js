import { getUser } from "../utils/storage";

export function renderSidebar(){
    const sidebarEl = document.getElementById("sidebar-nav");
    const user = getUser();

    //these buttons will only be enabled for admin users
    const adminbuttons = user && [1, 2].includes(user.role_id) ?`
                <button data-page = "returns">Devoluciones</button>
                <button data-page = "users">Usuarios</button>
                <button data-page = "expenses">Gastos</button>
                <button data-page = "reports">Reportes</button>
        `: "";
        
    return `
        <aside class = "sidebar">
            <div class="sidebar-logo-wrap">
                <img
                    src="https://farmaquin-backend.onrender.com/static/logo.png"
                    alt="Logo Farmaquin"
                    class="sidebar-logo-img"
                />
            </div>
            <nav class = "sidebar-nav">
                <button data-page = "dashboard">Inicio</button>
                <button data-page = "pos">Punto de Venta</button>
                <button data-page = "inventory">Inventario</button>
                <button data-page = "cashcut">Corte de Caja</button>
                ${adminbuttons}
                <button id = "logout-btn">Cerrar Sesion</button>
                <button data-page="change-password">Cambiar contraseña</button>
            </nav>
        </aside>
    `;
}

