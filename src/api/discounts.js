import { apiFetch } from "./client";

export async function getDiscounts() {
    return await apiFetch("/discounts", { method: "GET" });
}

export async function createDiscount(payload) {
    return await apiFetch("/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function updateDiscount(id, payload) {
    return await apiFetch(`/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function deleteDiscount(id) {
    return await apiFetch(`/discounts/${id}`, { method: "DELETE" });
}
