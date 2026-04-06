import { apiFetch } from "./client";

export async function previewCashCut() {
    return await apiFetch("/cashcut/preview", {
        method: "GET",
    });
}

export async function closeCashCut(payload) {
    return await apiFetch("/cashcut/close", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}