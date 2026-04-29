import { getDashboardAlerts } from "../api/dashboard";
import { getUser } from "../utils/storage";
import { formatDateMX } from "../utils/date";

export async function renderDashboard(container) {
    const user = getUser();
    const today = formatDateMX(new Date().toISOString());

    container.innerHTML = `
        <div class="page">
            <div class="dashboard-header">
                <div>
                    <h2>Bienvenido, ${user?.name || "usuario"}</h2>
                    <p class="dashboard-date">${today}</p>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-panel card" id="panel-low-stock">
                    <div class="dashboard-panel-title danger">
                        <span class="dot dot-red"></span> Stock bajo
                    </div>
                    <p class="dashboard-loading">Cargando...</p>
                </div>

                <div class="dashboard-panel card" id="panel-expiring">
                    <div class="dashboard-panel-title warning">
                        <span class="dot dot-orange"></span> Por vencer
                    </div>
                    <p class="dashboard-loading">Cargando...</p>
                </div>

                <div class="dashboard-panel card" id="panel-promotions">
                    <div class="dashboard-panel-title success">
                        <span class="dot dot-green"></span> Promociones activas
                    </div>
                    <p class="dashboard-loading">Cargando...</p>
                </div>
            </div>
        </div>
    `;

    try {
        const alerts = await getDashboardAlerts();
        renderLowStock(alerts.low_stock);
        renderExpiring(alerts.expiring);
        renderPromotions(alerts.promotions);
    } catch (e) {
        ["panel-low-stock", "panel-expiring", "panel-promotions"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.querySelector(".dashboard-loading").textContent = "Error al cargar.";
        });
    }
}

function renderLowStock(items) {
    const panel = document.getElementById("panel-low-stock");
    if (!items.length) {
        panel.querySelector(".dashboard-loading").textContent = "Sin productos por agotarse.";
        return;
    }
    panel.querySelector(".dashboard-loading").remove();
    const list = document.createElement("div");
    list.className = "dashboard-list";
    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "dashboard-list-row";
        const level = item.min_stock > 0 ? Math.round((item.stock / item.min_stock) * 100) : 0;
        const cls = level === 0 ? "badge-red" : "badge-orange";
        row.innerHTML = `
            <span class="dashboard-item-name">${item.name}</span>
            <span class="dashboard-badge ${cls}">${item.stock} / ${item.min_stock}</span>
        `;
        list.appendChild(row);
    });
    panel.appendChild(list);
}

function renderExpiring(items) {
    const panel = document.getElementById("panel-expiring");
    if (!items.length) {
        panel.querySelector(".dashboard-loading").textContent = "Sin lotes próximos a vencer.";
        return;
    }
    panel.querySelector(".dashboard-loading").remove();
    const list = document.createElement("div");
    list.className = "dashboard-list";
    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "dashboard-list-row";
        const days = item.days_left;
        const cls = days <= 15 ? "badge-red" : "badge-orange";
        const label = days <= 0 ? "VENCIDO" : `${days}d`;
        row.innerHTML = `
            <div>
                <span class="dashboard-item-name">${item.name}</span>
                <small class="dashboard-item-sub">Lote ${item.lot} · ${item.qty} pzas</small>
            </div>
            <span class="dashboard-badge ${cls}">${label}</span>
        `;
        list.appendChild(row);
    });
    panel.appendChild(list);
}

function renderPromotions(items) {
    const panel = document.getElementById("panel-promotions");
    if (!items.length) {
        panel.querySelector(".dashboard-loading").textContent = "Sin promociones activas.";
        return;
    }
    panel.querySelector(".dashboard-loading").remove();
    const list = document.createElement("div");
    list.className = "dashboard-list";
    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "dashboard-list-row";
        const desc = item.type === "PORCENTAJE" ? `${item.value}% off` : `$${item.value} off`;
        row.innerHTML = `
            <div>
                <span class="dashboard-item-name">${item.product_name}</span>
                <small class="dashboard-item-sub">${item.name || ""}</small>
            </div>
            <span class="dashboard-badge badge-green">${desc}</span>
        `;
        list.appendChild(row);
    });
    panel.appendChild(list);
}
