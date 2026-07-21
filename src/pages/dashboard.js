import { getDashboardAlerts } from "../api/dashboard";
import { getUser } from "../utils/storage";
import { formatDateMX } from "../utils/date";
import { getNotesBoard, getMyNotes, updateMyNote, addTask, updateTask, deleteTask } from "../api/notes";

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
                <div class="dashboard-header-actions">
                    <button id="btn-show-board" class="btn-board">Ver Tablero</button>
                    <button id="btn-my-notes" class="btn-board btn-board-secondary">Mis Notas</button>
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

            <!-- Board modal (read-only, all users) -->
            <div class="notes-overlay hidden" id="board-modal">
                <div class="notes-modal notes-modal--board">
                    <div class="notes-modal-header">
                        <h3>Tablero del turno</h3>
                        <button class="notes-close" id="board-close">&times;</button>
                    </div>
                    <div class="notes-board-grid" id="board-content">
                        <p>Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- Edit modal (own note + tasks) -->
            <div class="notes-overlay hidden" id="edit-modal">
                <div class="notes-modal">
                    <div class="notes-modal-header">
                        <h3>Mis Notas del turno</h3>
                        <button class="notes-close" id="edit-close">&times;</button>
                    </div>
                    <div class="notes-edit-grid">
                        <div class="notes-section">
                            <h4>Nota</h4>
                            <textarea id="my-note-text" rows="6" placeholder="Escribe tu nota del turno..."></textarea>
                            <button id="btn-save-note" class="btn-note-save">Guardar nota</button>
                            <p id="note-feedback" class="note-feedback"></p>
                        </div>
                        <div class="notes-section">
                            <h4>Tareas</h4>
                            <div id="my-tasks-list" class="my-tasks-list"></div>
                            <div class="task-add-row">
                                <input type="text" id="new-task-input" placeholder="Nueva tarea..." />
                                <button id="btn-add-task">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load dashboard alerts
    try {
        const alerts = await getDashboardAlerts();
        renderLowStock(alerts.low_stock);
        renderExpiring(alerts.expiring);
        renderPromotions(alerts.promotions);
    } catch {
        ["panel-low-stock", "panel-expiring", "panel-promotions"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.querySelector(".dashboard-loading").textContent = "Error al cargar.";
        });
    }

    // Show board modal on load only if there's content from other users
    await showBoardModal({ autoLoad: true });

    const showBoardBtn = document.getElementById("btn-show-board");
    showBoardBtn.addEventListener("click", async () => {
        const hadContent = await showBoardModal({ autoLoad: false });
        if (!hadContent) {
            showBoardPopover(showBoardBtn, "No hay notas ni tareas de otros usuarios.");
        }
    });
    document.getElementById("board-close").addEventListener("click", () => {
        document.getElementById("board-modal").classList.add("hidden");
    });

    document.getElementById("btn-my-notes").addEventListener("click", openEditModal);
    document.getElementById("edit-close").addEventListener("click", () => {
        document.getElementById("edit-modal").classList.add("hidden");
    });

    document.getElementById("btn-save-note").addEventListener("click", saveNote);
    document.getElementById("btn-add-task").addEventListener("click", addNewTask);
    document.getElementById("new-task-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") addNewTask();
    });

    // Close modals when clicking overlay background
    document.getElementById("board-modal").addEventListener("click", (e) => {
        if (e.target.id === "board-modal") e.target.classList.add("hidden");
    });
    document.getElementById("edit-modal").addEventListener("click", (e) => {
        if (e.target.id === "edit-modal") e.target.classList.add("hidden");
    });
}

function showBoardPopover(anchor, message) {
    document.getElementById("board-popover")?.remove();
    const pop = document.createElement("div");
    pop.id = "board-popover";
    pop.className = "board-popover";
    pop.textContent = message;
    document.body.appendChild(pop);

    // Position after render so offsetHeight is accurate
    requestAnimationFrame(() => {
        const rect = anchor.getBoundingClientRect();
        const popRect = pop.getBoundingClientRect();
        pop.style.left = `${rect.left + window.scrollX}px`;
        pop.style.top = `${rect.top + window.scrollY - popRect.height - 8}px`;
    });

    const dismiss = () => pop.remove();
    setTimeout(dismiss, 3000);
    pop.addEventListener("click", dismiss);
}

async function showBoardModal({ autoLoad = false } = {}) {
    const modal = document.getElementById("board-modal");
    const content = document.getElementById("board-content");

    try {
        const { notes, tasks } = await getNotesBoard();
        const myId = getUser()?.sub;

        const othersNotes = notes.filter(n => n.user_id !== myId);
        const othersTasks = tasks.filter(t => t.user_id !== myId);

        const hasNotes = othersNotes.length > 0;
        const hasTasks = othersTasks.length > 0;

        if (!hasNotes && !hasTasks) {
            // On auto-load don't open the modal at all
            return false;
        }

        const cols = [];
        if (hasNotes) cols.push(`
            <div class="board-col">
                <div class="board-col-title">Notas</div>
                ${othersNotes.map(n => `
                    <div class="board-note-card">
                        <div class="board-note-author">${n.user_name}</div>
                        <div class="board-note-body">${escapeHtml(n.content)}</div>
                    </div>
                `).join("")}
            </div>
        `);
        if (hasTasks) cols.push(`
            <div class="board-col">
                <div class="board-col-title">Tareas</div>
                ${renderBoardTasks(othersTasks)}
            </div>
        `);
        content.innerHTML = cols.join("");
        modal.classList.remove("hidden");
        return true;
    } catch (err) {
        console.error("[board]", err);
        if (!autoLoad) {
            content.innerHTML = `<p class="board-empty">Error al cargar el tablero: ${err.message}</p>`;
            modal.classList.remove("hidden");
        }
        return false;
    }
}

function renderBoardTasks(tasks) {
    if (!tasks.length) return `<p class="board-empty">Sin tareas de otros usuarios.</p>`;
    const byUser = {};
    tasks.forEach(t => {
        if (!byUser[t.user_name]) byUser[t.user_name] = [];
        byUser[t.user_name].push(t);
    });
    return Object.entries(byUser).map(([name, userTasks]) => `
        <div class="board-note-card">
            <div class="board-note-author">${name}</div>
            ${userTasks.map(t => `
                <div class="board-task-row ${t.done ? "task-done" : ""}">
                    <span class="task-check">${t.done ? "✓" : "○"}</span>
                    <span>${escapeHtml(t.description)}</span>
                </div>
            `).join("")}
        </div>
    `).join("");
}

async function openEditModal() {
    document.getElementById("edit-modal").classList.remove("hidden");
    document.getElementById("note-feedback").textContent = "";

    try {
        const { note, tasks } = await getMyNotes();
        document.getElementById("my-note-text").value = note || "";
        renderMyTasks(tasks);
    } catch {
        document.getElementById("my-note-text").value = "";
        renderMyTasks([]);
    }
}

function renderMyTasks(tasks) {
    const list = document.getElementById("my-tasks-list");
    if (!tasks.length) {
        list.innerHTML = `<p class="board-empty">Sin tareas. Agrega una abajo.</p>`;
        return;
    }
    list.innerHTML = tasks.map(t => `
        <div class="my-task-row" data-id="${t.id}">
            <button class="task-toggle-btn ${t.done ? "done" : ""}" data-done="${t.done}" data-desc="${escapeAttr(t.description)}">${t.done ? "✓" : "○"}</button>
            <span class="my-task-desc ${t.done ? "task-done" : ""}">${escapeHtml(t.description)}</span>
            <button class="task-delete-btn">&times;</button>
        </div>
    `).join("");

    list.querySelectorAll(".task-toggle-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const row = btn.closest(".my-task-row");
            const id = Number(row.dataset.id);
            const done = btn.dataset.done === "true";
            const desc = btn.dataset.desc;
            try {
                await updateTask(id, desc, !done);
                const { tasks: updated } = await getMyNotes();
                renderMyTasks(updated);
            } catch (e) {
                console.error(e);
            }
        });
    });

    list.querySelectorAll(".task-delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const row = btn.closest(".my-task-row");
            const id = Number(row.dataset.id);
            try {
                await deleteTask(id);
                const { tasks: updated } = await getMyNotes();
                renderMyTasks(updated);
            } catch (e) {
                console.error(e);
            }
        });
    });
}

async function saveNote() {
    const text = document.getElementById("my-note-text").value;
    const feedback = document.getElementById("note-feedback");
    try {
        await updateMyNote(text);
        feedback.textContent = "Guardado";
        feedback.className = "note-feedback success";
        setTimeout(() => { feedback.textContent = ""; }, 2000);
    } catch {
        feedback.textContent = "Error al guardar";
        feedback.className = "note-feedback error";
    }
}

async function addNewTask() {
    const input = document.getElementById("new-task-input");
    const desc = input.value.trim();
    if (!desc) return;
    try {
        await addTask(desc);
        input.value = "";
        const { tasks } = await getMyNotes();
        renderMyTasks(tasks);
    } catch (e) {
        console.error(e);
    }
}

function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
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
        row.className = "dashboard-list-row dashboard-list-row--link";
        const level = item.min_stock > 0 ? Math.round((item.stock / item.min_stock) * 100) : 0;
        const cls = level === 0 ? "badge-red" : "badge-orange";
        row.innerHTML = `
            <span class="dashboard-item-name">${item.name}</span>
            <span class="dashboard-badge ${cls}">${item.stock} / ${item.min_stock}</span>
        `;
        row.addEventListener("click", () => {
            sessionStorage.setItem("inventory_search", item.name);
            document.querySelector('[data-page="inventory"]')?.click();
        });
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
