import { apiFetch } from "./client";

//this file contains functions related to product operations, such as searching for products and scanning products by barcode
export async function searchProducts(query) {
    const params = new URLSearchParams({
        query: query,
    });

    return await apiFetch(`/pos/search?${params.toString()}`, {
        method: "GET",
    });
}

export async function scanProduct(barcode, quantity = 1) {
    const params = new URLSearchParams({
        barcode: barcode,
        quantity: quantity,
    });

    return await apiFetch(`/pos/scan?${params.toString()}`, {
        method: "GET",
    });
}