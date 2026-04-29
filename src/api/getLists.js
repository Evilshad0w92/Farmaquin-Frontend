import { apiFetch } from "./client";

export async function getProviders() {
    return await apiFetch("/providers", { method: "GET" });
}

export async function getSections() {
    return await apiFetch("/sections", { method: "GET" });
}

export async function getInventory() {
    return await apiFetch("/inventory", { method: "GET" });
}

export async function getLabNames() {
    return await apiFetch("/inventory/labs", { method: "GET" });
}

export async function getMethodNames() {
    return await apiFetch("/inventory/methods", { method: "GET" });
}
