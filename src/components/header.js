import { getUser } from "../utils/storage";

export function renderHeader(){
    const user = getUser();

    return `
        <header class = "topbar">
            <div>
                <strong>Usuario actual: ${user?.name || user?.username || "Usuario"}</strong>
            </div>
            <div>${user?.location_name ? `<strong>${user.location_name}</strong>` : "ERP / POS Farmacia"}</div>
        </header>
    `;
}