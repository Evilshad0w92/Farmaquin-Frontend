import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "../api/discounts";
import { searchInventory } from "../api/inventory";

export async function renderDiscounts(container) {
    let discountsList = [];
    let selectedDiscount = null;
    let currentMode = null;
    let selectedProduct = null;
    let feedbackTimeout = null;

    container.innerHTML = `
        <div class="page">
            <h2>Descuentos</h2>

            <div class="inventory-toolbar card">
                <div class="inventory-filters">
                    <div class="inventory-actions">
                        <button id="btn-new-discount">+ Nuevo Descuento</button>
                    </div>
                </div>
            </div>

            <div id="discount-list" class="inventory-list">
                <p>Cargando...</p>
            </div>

            <!-- Modal -->
            <div class="inventory-modal hidden" id="discount-modal">
                <div class="inventory-modal-content">
                    <h3 id="discount-modal-title">Descuento</h3>

                    <div class="form-grid">
                        <div class="form-group full">
                            <label for="d-name">Nombre</label>
                            <input type="text" id="d-name" placeholder="Ej. Descuento empleado"/>
                        </div>
                        <div class="form-group">
                            <label for="d-type">Tipo</label>
                            <select id="d-type">
                                <option value="PORCENTAJE">Porcentaje (%)</option>
                                <option value="FIJO">Monto fijo ($)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="d-value" id="d-value-label">Valor (%)</label>
                            <input type="number" id="d-value" min="0.01" step="0.01" placeholder="0"/>
                        </div>
                        <div class="form-group">
                            <label for="d-start">Fecha inicio</label>
                            <input type="date" id="d-start"/>
                        </div>
                        <div class="form-group">
                            <label for="d-end">Fecha fin</label>
                            <input type="date" id="d-end"/>
                        </div>
                        <div class="form-group full">
                            <label for="d-product-search">Producto (opcional — dejar vacío para descuento general)</label>
                            <input type="text" id="d-product-search" placeholder="Buscar producto por nombre..."/>
                            <div id="d-product-results" class="pos-results" style="max-height:160px;overflow-y:auto;"></div>
                            <small id="d-product-label" style="color:#6b7280;"></small>
                        </div>
                        <div class="form-group full checkbox-group">
                            <input type="checkbox" id="d-active" checked/>
                            <label for="d-active">Activo</label>
                        </div>
                    </div>

                    <p id="discount-modal-error" class="modal-message"></p>
                    <div class="inventory-modal-actions">
                        <button id="discount-confirm">Guardar</button>
                        <button id="discount-cancel" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const listEl        = document.getElementById("discount-list");
    const modalEl       = document.getElementById("discount-modal");
    const modalTitleEl  = document.getElementById("discount-modal-title");
    const modalErrorEl  = document.getElementById("discount-modal-error");

    const dName         = document.getElementById("d-name");
    const dType         = document.getElementById("d-type");
    const dValueLabel   = document.getElementById("d-value-label");
    const dValue        = document.getElementById("d-value");
    const dStart        = document.getElementById("d-start");
    const dEnd          = document.getElementById("d-end");
    const dProductSearch = document.getElementById("d-product-search");
    const dProductResults = document.getElementById("d-product-results");
    const dProductLabel = document.getElementById("d-product-label");
    const dActive       = document.getElementById("d-active");

    const today = new Date().toISOString().split("T")[0];

    dType.addEventListener("change", () => {
        dValueLabel.textContent = dType.value === "PORCENTAJE" ? "Valor (%)" : "Valor ($)";
    });

    dProductSearch.addEventListener("input", async () => {
        const q = dProductSearch.value.trim();
        if (!q) { dProductResults.innerHTML = ""; return; }
        try {
            const { items } = await searchInventory(q);
            dProductResults.innerHTML = items.map((p, i) => `
                <div class="result-row" data-index="${i}" style="cursor:pointer;padding:6px 8px;border-bottom:1px solid #eee;">
                    <strong>${p.name}</strong> <small>${p.formula || ""}</small>
                </div>
            `).join("");
            dProductResults.querySelectorAll(".result-row").forEach((row, i) => {
                row.addEventListener("click", () => {
                    selectedProduct = items[i];
                    dProductSearch.value = selectedProduct.name;
                    dProductLabel.textContent = `ID: ${selectedProduct.id}`;
                    dProductResults.innerHTML = "";
                });
            });
        } catch { dProductResults.innerHTML = ""; }
    });

    async function loadDiscounts() {
        try {
            discountsList = await getDiscounts();
            renderList();
        } catch (e) {
            listEl.innerHTML = `<p class="error">Error: ${e.message}</p>`;
        }
    }

    function renderList() {
        if (!discountsList.length) {
            listEl.innerHTML = `<p>Sin descuentos registrados.</p>`;
            return;
        }
        listEl.innerHTML = `
            <div class="inventory-table">
                <div class="inventory-header" style="grid-template-columns:2fr 1fr 1fr 2fr 1fr 1fr 1fr;">
                    <div>Nombre</div>
                    <div>Tipo</div>
                    <div>Valor</div>
                    <div>Producto</div>
                    <div>Inicio</div>
                    <div>Fin</div>
                    <div>Acciones</div>
                </div>
                ${discountsList.map(d => `
                    <div class="inventory-row ${d.active ? "" : "opacity-50"}" data-id="${d.id}"
                         style="grid-template-columns:2fr 1fr 1fr 2fr 1fr 1fr 1fr;${!d.active ? "opacity:0.5;" : ""}">
                        <div>${d.name}</div>
                        <div>${d.type === "PORCENTAJE" ? "%" : "$"}</div>
                        <div>${d.type === "PORCENTAJE" ? `${Number(d.value).toFixed(1)}%` : `$${Number(d.value).toFixed(2)}`}</div>
                        <div>${d.product_name || "<em>General</em>"}</div>
                        <div>${d.start_date}</div>
                        <div>${d.end_date}</div>
                        <div class="inventory-actions">
                            <button class="btn-edit-discount">Editar</button>
                            ${d.active ? `<button class="btn-del-discount">Desactivar</button>` : ""}
                        </div>
                    </div>
                `).join("")}
            </div>`;

        listEl.querySelectorAll(".btn-edit-discount").forEach(btn => {
            const id = Number(btn.closest(".inventory-row").dataset.id);
            btn.addEventListener("click", () => openModal("edit", discountsList.find(d => d.id === id)));
        });
        listEl.querySelectorAll(".btn-del-discount").forEach(btn => {
            const id = Number(btn.closest(".inventory-row").dataset.id);
            btn.addEventListener("click", () => handleDelete(id));
        });
    }

    function openModal(mode, discount = null) {
        currentMode = mode;
        selectedDiscount = discount;
        selectedProduct = null;
        clearError();

        modalTitleEl.textContent = mode === "edit" ? "Editar Descuento" : "Nuevo Descuento";

        if (mode === "edit" && discount) {
            dName.value   = discount.name;
            dType.value   = discount.type;
            dValueLabel.textContent = discount.type === "PORCENTAJE" ? "Valor (%)" : "Valor ($)";
            dValue.value  = discount.value;
            dStart.value  = discount.start_date;
            dEnd.value    = discount.end_date;
            dActive.checked = discount.active;
            dProductSearch.value = discount.product_name || "";
            dProductLabel.textContent = discount.product_id ? `ID: ${discount.product_id}` : "";
            if (discount.product_id) {
                selectedProduct = { id: discount.product_id, name: discount.product_name };
            }
        } else {
            dName.value   = "";
            dType.value   = "PORCENTAJE";
            dValueLabel.textContent = "Valor (%)";
            dValue.value  = "";
            dStart.value  = today;
            dEnd.value    = "";
            dActive.checked = true;
            dProductSearch.value = "";
            dProductLabel.textContent = "";
        }

        dProductResults.innerHTML = "";
        modalEl.classList.remove("hidden");
    }

    function closeModal() {
        modalEl.classList.add("hidden");
        selectedDiscount = null;
        selectedProduct = null;
        currentMode = null;
    }

    async function handleConfirm() {
        clearError();
        const payload = {
            name:       dName.value.trim(),
            type:       dType.value,
            value:      Number(dValue.value),
            start_date: dStart.value,
            end_date:   dEnd.value,
            product_id: selectedProduct?.id ?? null,
            active:     dActive.checked,
        };

        if (!payload.name) { showError("El nombre es obligatorio"); return; }
        if (!payload.value || payload.value <= 0) { showError("El valor debe ser mayor a cero"); return; }
        if (!payload.start_date || !payload.end_date) { showError("Las fechas son obligatorias"); return; }

        try {
            if (currentMode === "create") {
                await createDiscount(payload);
            } else {
                await updateDiscount(selectedDiscount.id, payload);
            }
            closeModal();
            await loadDiscounts();
        } catch (e) {
            showError(e.message || "Error al guardar");
        }
    }

    async function handleDelete(id) {
        if (!confirm("¿Desactivar este descuento?")) return;
        try {
            await deleteDiscount(id);
            await loadDiscounts();
        } catch (e) {
            alert(e.message || "Error al desactivar");
        }
    }

    function showError(msg) {
        modalErrorEl.textContent = msg;
        modalErrorEl.className = "modal-message error";
        if (feedbackTimeout) clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => { modalErrorEl.textContent = ""; }, 3000);
    }

    function clearError() {
        if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
        modalErrorEl.textContent = "";
        modalErrorEl.className = "modal-message";
    }

    document.getElementById("btn-new-discount").addEventListener("click", () => openModal("create"));
    document.getElementById("discount-confirm").addEventListener("click", handleConfirm);
    document.getElementById("discount-cancel").addEventListener("click", closeModal);

    await loadDiscounts();
}
