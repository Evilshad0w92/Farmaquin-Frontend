import { apiFetch } from "./client";

export async function getDashboardAlerts() {
    return await apiFetch("/dashboard/alerts", { method: "GET" });
}
