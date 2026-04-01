import { apiFetch } from "./client";

//This file contains the functions to searching for inventory items, create inventory adjustments and restocks. 
export async function searchInventory(query = "", lowStock = false) {
    const params = new URLSearchParams({
        query,
        low_stock: String(lowStock),
    });

    return await apiFetch(`/inventory/search?${params.toString()}`, { method: "GET" });
}

export async function createInventoryAdjustment(payload) {
    return await apiFetch("/inventory/adjustment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

export async function createInventoryRestock(payload) {
    return await apiFetch("/inventory/restock", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

export async function createItemProduct(payload) {
    return await apiFetch("/inventory/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}