import { apiFetch, API_BASE_URL } from "./client";

//This file contains the functions to searching for inventory items, create inventory adjustments and restocks.
export async function searchInventory(query = "", lowStock = false, offset = 0) {
    const params = new URLSearchParams({
        query,
        low_stock: String(lowStock),
        offset: String(offset),
    });

    return await apiFetch(`/inventory/search?${params.toString()}`, { method: "GET" });
}

export async function createInventoryAdjustment(payload) {
    return await apiFetch("/inventory/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function createInventoryRestock(payload) {
    return await apiFetch("/inventory/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function createItemProduct(payload) {
    return await apiFetch("/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function editItemProduct(payload) {
    return await apiFetch("/inventory/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function searchBatches(query = "") {
    const params = new URLSearchParams({ query });
    return await apiFetch(`/inventory/batches?${params.toString()}`, { method: "GET" });
}

export async function getProductBatches(productId) {
    return await apiFetch(`/inventory/batches/${productId}`, { method: "GET" });
}

export async function createProductBatch(payload) {
    return await apiFetch("/inventory/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function editProductBatch(batchId, payload) {
    return await apiFetch(`/inventory/batch/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function deleteProductBatch(batchId) {
    return await apiFetch(`/inventory/batch/${batchId}`, { method: "DELETE" });
}

export async function getProductByBarcode(barcode) {
    return await apiFetch(`/inventory/barcode/${encodeURIComponent(barcode)}`, { method: "GET" });
}

export async function getProductSalesHistory(productId) {
    return await apiFetch(`/inventory/sales-history/${productId}`, { method: "GET" });
}

export async function downloadLowStockExcel() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/inventory/export/low-stock`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Error al exportar");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "por_agotarse.xlsx";
    a.click();
    URL.revokeObjectURL(url);
}
