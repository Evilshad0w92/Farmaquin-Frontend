import "./styles/main.css";
import "./styles/login.css";
import "./styles/layout.css";
import "./styles/pos.css";
import "./styles/inventory.css";
import "./styles/users.css";
import "./styles/cashcut.css";import "./styles/expenses.css";

import { renderLogin } from "./pages/login";
import { renderDashboard } from "./pages/dashboard";
import { renderPOS } from "./pages/pos";
import { renderSidebar } from "./components/sidebar";
import { renderHeader } from "./components/header";
import { getToken, clearSession } from "./utils/storage";
import { renderInventory } from "./pages/inventory";
import { renderUsers } from "./pages/users";
import { renderCashCut } from "./pages/cashcut";
import { renderChangePassword } from "./pages/changePassword";
import { renderExpenses } from "./pages/expenses";
import { renderBatches } from "./pages/batches";

const app = document.querySelector("#app");

//renders the page layout,by default: dashboard, and replace its content depending on the page sent 
function renderLayout(page = "dashboard"){
    app.innerHTML = `
        <div class = "app-shell">
            ${renderSidebar()}
                        
            <div class = "main-area">
                ${renderHeader()}
                <main id = "page-content" class = "page-content"></main>
            </div>
        </div>
    `;

    //Renders the corresponding page
    const content = document.getElementById("page-content");
    if(page === "dashboard"){
        renderDashboard(content);
    }

    if(page === "pos"){
        renderPOS(content);
    }

    if(page === "inventory"){
        renderInventory(content);
    }

    if(page === "users"){
        renderUsers(content);
    }

    if(page === "cashcut"){
        renderCashCut(content);
    }

    if(page === "expenses"){
        renderExpenses(content);
    }   

    if (page === "batches") {
        renderBatches(content);
    }

    if (page === "change-password") {
        renderChangePassword(content);
    }

    //Reads the button clicked with atribute data-page and calls renderLayout to refresh to the corresponding layout
    document.querySelectorAll("[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
            renderLayout(btn.dataset.page);
        });
    });

    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn?.addEventListener("click", () => {
        if (!confirm("¿Seguro que deseas cerrar sesión?")) return;
        clearSession();
        initApp();
    });
}

function initApp(){
    const token = getToken();

    if(!token){
        renderLogin(app, () => renderLayout("dashboard"));
        return;
    }

    renderLayout("dashboard")
}

initApp();