import { apiFetch } from "./client";

//this file contains functions related to sales operations, such as creating a sale and fetching the sale ticket
export async function createSale(payload) {
    return await apiFetch("/sales", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export async function getSaleTicket(saleId) {
    return await apiFetch(`/sales/${saleId}/ticket`, {
        method: "GET",
    });
}   