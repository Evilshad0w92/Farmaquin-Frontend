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

export async function resendCashcutReport(cutId) {
    return await apiFetch(`/cashcut/resend/${cutId}`, { method: "POST" });
}

export async function resendLatestReport() {
    return await apiFetch("/cashcut/resend/latest", { method: "POST" });
}