import { apiFetch } from "./client";

export function searchExpenses(query = "") {
    return apiFetch(`/expenses/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
    });
}

export function createExpense(payload) {
    return apiFetch("/expenses/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export function updateExpense(payload) {
    return apiFetch("/expenses/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export function deleteExpense(expenseId) {
    return apiFetch(`/expenses/${expenseId}`, {
        method: "DELETE",
    });
}