import { apiFetch } from "./api";

export function searchExpenses(query = "") {
    return apiFetch(`/expenses/search?query=${encodeURIComponent(query)}`);
}

export function createExpense(data) {
    return apiFetch("/expenses/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateExpense(data) {
    return apiFetch("/expenses/update", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function deleteExpense(id) {
    return apiFetch(`/expenses/${id}`, {
        method: "DELETE",
    });
}