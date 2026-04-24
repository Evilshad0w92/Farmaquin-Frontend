import { apiFetch } from "./client";

function buildParams(dateFrom, dateTo) {
    const p = new URLSearchParams();
    if (dateFrom) p.append("date_from", dateFrom);
    if (dateTo) p.append("date_to", dateTo);
    return p.toString() ? `?${p.toString()}` : "";
}

export async function getReportSales(dateFrom, dateTo) {
    return await apiFetch(`/reports/sales${buildParams(dateFrom, dateTo)}`, { method: "GET" });
}

export async function getSalesForPrint(dateFrom, dateTo) {
    return await apiFetch(`/reports/sales/print${buildParams(dateFrom, dateTo)}`, { method: "GET" });
}

export async function getReportExpenses(dateFrom, dateTo) {
    return await apiFetch(`/reports/expenses${buildParams(dateFrom, dateTo)}`, { method: "GET" });
}

export async function getReportPurchases(dateFrom, dateTo) {
    return await apiFetch(`/reports/purchases${buildParams(dateFrom, dateTo)}`, { method: "GET" });
}

export async function getReportCashcuts(dateFrom, dateTo) {
    return await apiFetch(`/reports/cashcuts${buildParams(dateFrom, dateTo)}`, { method: "GET" });
}

export async function getCashcutForReprint(cutId) {
    return await apiFetch(`/reports/cashcut/${cutId}`, { method: "GET" });
}
