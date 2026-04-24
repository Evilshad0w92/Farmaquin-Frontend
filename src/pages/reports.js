import { getReportSales, getReportExpenses, getReportPurchases, getReportCashcuts, getCashcutForReprint, getSalesForPrint } from "../api/reports";
import { getSaleTicket } from "../api/sales";
import { printTicket } from "../api/print";
import { formatDateMX } from "../utils/date";

export async function renderReports(container) {
    let currentTab = "sales";

    container.innerHTML = `
        <div class="page">
            <h2>Reportes</h2>

            <!-- Filtros de fecha -->
            <div class="inventory-toolbar card">
                <div class="inventory-filters">
                    <div>
                        <label for="report-date-from">Desde:</label>
                        <input type="date" id="report-date-from"/>
                    </div>
                    <div>
                        <label for="report-date-to">Hasta:</label>
                        <input type="date" id="report-date-to"/>
                    </div>
                    <button id="btn-report-search">Buscar</button>
                    <button id="btn-report-clear" class="secondary">Limpiar</button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="report-tabs">
                <button class="report-tab active" data-tab="sales">Ventas</button>
                <button class="report-tab" data-tab="purchases">Compras</button>
                <button class="report-tab" data-tab="expenses">Gastos</button>
                <button class="report-tab" data-tab="cashcuts">Cortes de Caja</button>
            </div>

            <div id="report-content" class="inventory-list">
                <p>Selecciona un rango de fechas y presiona Buscar.</p>
            </div>

            <p id="report-error" class="login-error"></p>
        </div>
    `;

    const dateFromEl = document.getElementById("report-date-from");
    const dateToEl = document.getElementById("report-date-to");
    const searchBtn = document.getElementById("btn-report-search");
    const clearBtn = document.getElementById("btn-report-clear");
    const contentEl = document.getElementById("report-content");
    const errorEl = document.getElementById("report-error");

    // Set default: today
    const today = new Date().toISOString().split("T")[0];
    dateFromEl.value = today;
    dateToEl.value = today;

    document.querySelectorAll(".report-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".report-tab").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.dataset.tab;
            loadReport();
        });
    });

    searchBtn.addEventListener("click", loadReport);

    clearBtn.addEventListener("click", () => {
        dateFromEl.value = today;
        dateToEl.value = today;
        loadReport();
    });

    async function loadReport() {
        errorEl.textContent = "";
        contentEl.innerHTML = `<p>Cargando...</p>`;
        const dateFrom = dateFromEl.value || null;
        const dateTo = dateToEl.value || null;

        try {
            if (currentTab === "sales") await renderSales(dateFrom, dateTo);
            if (currentTab === "purchases") await renderPurchases(dateFrom, dateTo);
            if (currentTab === "expenses") await renderExpenses(dateFrom, dateTo);
            if (currentTab === "cashcuts") await renderCashcuts(dateFrom, dateTo);
        } catch (e) {
            errorEl.textContent = e.message || "Error al cargar el reporte";
            contentEl.innerHTML = "";
        }
    }

    // ── VENTAS ──────────────────────────────────────────────────────
    async function renderSales(dateFrom, dateTo) {
        const rows = await getReportSales(dateFrom, dateTo);
        if (!rows.length) { contentEl.innerHTML = `<p>Sin registros.</p>`; return; }

        const total = rows.reduce((s, r) => s + Number(r.total), 0);

        // Cache de items ya cargados { saleId: [...items] }
        const itemsCache = {};

        contentEl.innerHTML = `
            <div style="margin-bottom:8px;">
                <button id="btn-print-all-sales" class="btn-print-all">Imprimir todas (${rows.length})</button>
            </div>
            <div class="inventory-table">
                <div class="inventory-header">
                    <div>Folio</div>
                    <div>Método</div>
                    <div>Total</div>
                    <div>Vendido por</div>
                    <div>Fecha</div>
                    <div>Acciones</div>
                </div>
                ${rows.map(r => `
                    <div class="sale-group" data-sale-id="${r.id}">
                        <div class="inventory-row">
                            <div>
                                <button class="btn-toggle-detail" data-id="${r.id}" title="Ver artículos">▶</button>
                                #${r.id}
                            </div>
                            <div>${r.payment_method}</div>
                            <div>$${Number(r.total).toFixed(2)}</div>
                            <div>${r.sold_by}</div>
                            <div>${formatDateMX(r.created_at)}</div>
                            <div class="inventory-actions">
                                <button class="btn-reprint-sale" data-id="${r.id}">Reimprimir</button>
                            </div>
                        </div>
                        <div class="sale-detail hidden" id="detail-${r.id}"></div>
                    </div>
                `).join("")}
                <div class="inventory-row" style="font-weight:bold;border-top:2px solid #ccc;">
                    <div>Total</div><div></div>
                    <div>$${total.toFixed(2)}</div>
                    <div></div><div>${rows.length} ventas</div><div></div>
                </div>
            </div>`;

        // Desglose por venta
        contentEl.querySelectorAll(".btn-toggle-detail").forEach(btn => {
            btn.addEventListener("click", async () => {
                const saleId = Number(btn.dataset.id);
                const detailEl = document.getElementById(`detail-${saleId}`);
                const isOpen = !detailEl.classList.contains("hidden");

                if (isOpen) {
                    detailEl.classList.add("hidden");
                    btn.textContent = "▶";
                    return;
                }

                // Cargar items si no están en caché
                if (!itemsCache[saleId]) {
                    detailEl.innerHTML = `<p style="padding:6px 12px;color:#666;">Cargando...</p>`;
                    detailEl.classList.remove("hidden");
                    try {
                        const ticket = await getSaleTicket(saleId);
                        itemsCache[saleId] = ticket.items || [];
                    } catch (e) {
                        detailEl.innerHTML = `<p style="padding:6px 12px;color:red;">Error al cargar artículos.</p>`;
                        return;
                    }
                }

                const items = itemsCache[saleId];
                detailEl.innerHTML = items.length ? `
                    <div class="sale-items-table">
                        <div class="sale-items-header">
                            <div>Artículo</div>
                            <div>Cant.</div>
                            <div>Precio</div>
                            <div>Descuento</div>
                            <div>Total</div>
                        </div>
                        ${items.map(it => `
                            <div class="sale-items-row">
                                <div>${it.description}</div>
                                <div>${it.quantity}</div>
                                <div>$${Number(it.price).toFixed(2)}</div>
                                <div>$${Number(it.discount).toFixed(2)}</div>
                                <div>$${Number(it.total).toFixed(2)}</div>
                            </div>
                        `).join("")}
                    </div>` : `<p style="padding:6px 12px;color:#666;">Sin artículos.</p>`;

                detailEl.classList.remove("hidden");
                btn.textContent = "▼";
            });
        });

        // Reimprimir individual
        contentEl.querySelectorAll(".btn-reprint-sale").forEach(btn => {
            btn.addEventListener("click", () => reprintSale(Number(btn.dataset.id), btn));
        });

        // Imprimir todas
        document.getElementById("btn-print-all-sales").addEventListener("click", async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = "Preparando...";
            errorEl.textContent = "";
            try {
                const data = await getSalesForPrint(dateFrom, dateTo);
                const printPayload = {
                    ...data,
                    date_from: dateFrom ? formatDateMX(dateFrom) : "—",
                    date_to: dateTo ? formatDateMX(dateTo) : "—",
                    sales: (data.sales || []).map(s => ({
                        ...s,
                        created_at: formatDateMX(s.created_at),
                    })),
                };
                await printTicket(printPayload);
            } catch (e) {
                errorEl.textContent = `Error al imprimir reporte: ${e.message}`;
            } finally {
                btn.disabled = false;
                btn.textContent = `Imprimir todas (${rows.length})`;
            }
        });
    }

    async function reprintSale(saleId, btn) {
        btn.disabled = true;
        btn.textContent = "Imprimiendo...";
        try {
            const ticket = await getSaleTicket(saleId);
            await printTicket(ticket);
        } catch (e) {
            errorEl.textContent = `Error al reimprimir venta #${saleId}: ${e.message}`;
        } finally {
            btn.disabled = false;
            btn.textContent = "Reimprimir";
        }
    }

    // ── COMPRAS ─────────────────────────────────────────────────────
    async function renderPurchases(dateFrom, dateTo) {
        const rows = await getReportPurchases(dateFrom, dateTo);
        if (!rows.length) { contentEl.innerHTML = `<p>Sin registros.</p>`; return; }

        const totalCost = rows.reduce((s, r) => s + Number(r.unit_cost) * r.quantity, 0);

        contentEl.innerHTML = `
            <div class="inventory-table">
                <div class="inventory-header">
                    <div>Producto</div>
                    <div>Fórmula</div>
                    <div>Proveedor</div>
                    <div>Cantidad</div>
                    <div>Costo unit.</div>
                    <div>Precio venta</div>
                    <div>Registrado por</div>
                    <div>Fecha</div>
                </div>
                ${rows.map(r => `
                    <div class="inventory-row">
                        <div>${r.product_name}</div>
                        <div>${r.formula || "—"}</div>
                        <div>${r.provider_name}</div>
                        <div>${r.quantity}</div>
                        <div>$${Number(r.unit_cost).toFixed(2)}</div>
                        <div>$${Number(r.price_sell).toFixed(2)}</div>
                        <div>${r.registered_by}</div>
                        <div>${formatDateMX(r.created_at)}</div>
                    </div>
                `).join("")}
                <div class="inventory-row" style="font-weight:bold;border-top:2px solid #ccc;">
                    <div>Total invertido</div><div></div><div></div>
                    <div></div>
                    <div>$${totalCost.toFixed(2)}</div>
                    <div></div><div></div><div>${rows.length} compras</div>
                </div>
            </div>`;
    }

    // ── GASTOS ──────────────────────────────────────────────────────
    async function renderExpenses(dateFrom, dateTo) {
        const rows = await getReportExpenses(dateFrom, dateTo);
        if (!rows.length) { contentEl.innerHTML = `<p>Sin registros.</p>`; return; }

        const total = rows.reduce((s, r) => s + Number(r.amount), 0);

        contentEl.innerHTML = `
            <div class="inventory-table">
                <div class="inventory-header">
                    <div>Descripción</div>
                    <div>Tipo</div>
                    <div>Monto</div>
                    <div>Registrado por</div>
                    <div>Fecha</div>
                </div>
                ${rows.map(r => `
                    <div class="inventory-row">
                        <div>${r.description}</div>
                        <div>${r.expense_type}</div>
                        <div>$${Number(r.amount).toFixed(2)}</div>
                        <div>${r.registered_by}</div>
                        <div>${formatDateMX(r.created_at)}</div>
                    </div>
                `).join("")}
                <div class="inventory-row" style="font-weight:bold;border-top:2px solid #ccc;">
                    <div>Total</div><div></div>
                    <div>$${total.toFixed(2)}</div>
                    <div></div><div>${rows.length} gastos</div>
                </div>
            </div>`;
    }

    // ── CORTES ──────────────────────────────────────────────────────
    async function renderCashcuts(dateFrom, dateTo) {
        const rows = await getReportCashcuts(dateFrom, dateTo);
        if (!rows.length) { contentEl.innerHTML = `<p>Sin registros.</p>`; return; }

        const cutsCache = {};

        contentEl.innerHTML = `
            <div class="inventory-table report-cashcuts-table">
                <div class="inventory-header">
                    <div>ID</div>
                    <div>Desde</div>
                    <div>Hasta</div>
                    <div>Ventas netas</div>
                    <div>Efectivo</div>
                    <div>Tarjeta</div>
                    <div>Transferencia</div>
                    <div>Diferencia</div>
                    <div>Cerrado por</div>
                    <div>Acciones</div>
                </div>
                ${rows.map(r => `
                    <div class="cashcut-group">
                        <div class="inventory-row">
                            <div>
                                <button class="btn-toggle-detail btn-toggle-cut" data-id="${r.id}" title="Ver artículos">▶</button>
                                #${r.id}
                            </div>
                            <div>${formatDateMX(r.from_ts)}</div>
                            <div>${formatDateMX(r.to_ts)}</div>
                            <div>$${Number(r.net_total).toFixed(2)}</div>
                            <div>$${Number(r.total_cash).toFixed(2)}</div>
                            <div>$${Number(r.total_card).toFixed(2)}</div>
                            <div>$${Number(r.total_transfer).toFixed(2)}</div>
                            <div class="${Number(r.difference) < 0 ? "text-danger" : ""}">
                                $${Number(r.difference).toFixed(2)}
                            </div>
                            <div>${r.closed_by}</div>
                            <div class="inventory-actions">
                                <button class="btn-reprint-cut" data-id="${r.id}">Reimprimir</button>
                            </div>
                        </div>
                        <div class="cashcut-detail hidden" id="cut-detail-${r.id}"></div>
                    </div>
                `).join("")}
            </div>`;

        contentEl.querySelectorAll(".btn-toggle-cut").forEach(btn => {
            btn.addEventListener("click", async () => {
                const cutId = Number(btn.dataset.id);
                const detailEl = document.getElementById(`cut-detail-${cutId}`);
                const isOpen = !detailEl.classList.contains("hidden");

                if (isOpen) {
                    detailEl.classList.add("hidden");
                    btn.textContent = "▶";
                    return;
                }

                if (!cutsCache[cutId]) {
                    detailEl.innerHTML = `<p style="padding:6px 12px;color:#666;">Cargando...</p>`;
                    detailEl.classList.remove("hidden");
                    try {
                        const data = await getCashcutForReprint(cutId);
                        cutsCache[cutId] = data.products_summary || [];
                    } catch (e) {
                        detailEl.innerHTML = `<p style="padding:6px 12px;color:red;">Error al cargar artículos.</p>`;
                        return;
                    }
                }

                const products = cutsCache[cutId];
                detailEl.innerHTML = products.length ? `
                    <div class="cut-products-panel">
                        <div class="cut-products-title">Artículos vendidos en este corte</div>
                        <div class="cut-products-table">
                            <div class="cut-products-row cut-products-heading">
                                <div>Artículo</div>
                                <div>Cant.</div>
                                <div>Total</div>
                            </div>
                            ${products.map(p => `
                                <div class="cut-products-row">
                                    <div>${p.description}</div>
                                    <div>${p.quantity}</div>
                                    <div>$${Number(p.total).toFixed(2)}</div>
                                </div>
                            `).join("")}
                        </div>
                    </div>` : `<p style="padding:6px 12px;color:#666;">Sin artículos en este período.</p>`;

                detailEl.classList.remove("hidden");
                btn.textContent = "▼";
            });
        });

        contentEl.querySelectorAll(".btn-reprint-cut").forEach(btn => {
            btn.addEventListener("click", () => reprintCashcut(Number(btn.dataset.id), btn));
        });
    }

    async function reprintCashcut(cutId, btn) {
        btn.disabled = true;
        btn.textContent = "Imprimiendo...";
        try {
            const data = await getCashcutForReprint(cutId);
            const printPayload = {
                ...data,
                from_ts: formatDateMX(data.from_ts),
                to_ts: formatDateMX(data.to_ts),
                sales_detail: (data.sales_detail || []).map(s => ({
                    ...s,
                    created_at: formatDateMX(s.created_at),
                })),
            };
            await printTicket(printPayload);
        } catch (e) {
            errorEl.textContent = `Error al reimprimir corte #${cutId}: ${e.message}`;
        } finally {
            btn.disabled = false;
            btn.textContent = "Reimprimir";
        }
    }

    // Carga inicial
    await loadReport();
}
