import { searchBatches, editProductBatch, deleteProductBatch, createInventoryRestock } from "../api/inventory";
import { searchInventory } from "../api/inventory";
import { getProviders } from "../api/getLists";

export async function renderBatches(container) {
    let providers = [];
    let selectedBatch = null;
    let feedbackTimeout = null;
    let currentMode = null; // "edit" | "add"

    container.innerHTML = `
        <div class="page">
            <h2>Lotes de Inventario</h2>

            <div class="inventory-toolbar card">
                <div class="inventory-filters">
                    <div>
                        <label for="batch-search">Buscar:</label>
                        <input type="text" id="batch-search" placeholder="Producto, fórmula o lote"/>
                    </div>
                    <div class="inventory-actions">
                        <button id="btn-add-batch">+ Agregar Lote</button>
                    </div>
                </div>
            </div>

            <div id="batch-list" class="inventory-list">
                <p>Sin resultados.</p>
            </div>

            <!-- Modal -->
            <div class="inventory-modal hidden" id="batch-modal">
                <div class="inventory-modal-content">
                    <h3 id="batch-modal-title">Lote</h3>
                    <p id="batch-modal-subtitle"></p>

                    <!-- Búsqueda de producto (solo al agregar) -->
                    <div id="batch-product-search-group" class="hidden">
                        <div class="form-group full">
                            <label for="batch-product-search">Producto</label>
                            <input type="text" id="batch-product-search" placeholder="Buscar producto por nombre..."/>
                        </div>
                        <div id="batch-product-results" class="pos-results" style="max-height:180px;overflow-y:auto;margin-bottom:8px;"></div>
                    </div>

                    <div id="batch-form" class="form-grid">
                        <div class="form-group">
                            <label for="form-lot">Lote</label>
                            <input type="text" id="form-lot" placeholder="Número de lote"/>
                        </div>
                        <div class="form-group">
                            <label for="form-qty">Cantidad</label>
                            <input type="number" id="form-qty" min="1"/>
                        </div>
                        <div class="form-group">
                            <label for="form-expiration">Fecha de caducidad</label>
                            <input type="date" id="form-expiration"/>
                        </div>
                        <!-- Solo al agregar lote -->
                        <div class="form-group" id="form-sell-price-group">
                            <label for="form-sell-price">Precio de venta</label>
                            <input type="text" id="form-sell-price" class="money-input" inputmode="decimal" placeholder="0.00"/>
                        </div>
                        <div class="form-group" id="form-cost-group">
                            <label for="form-cost">Costo unitario</label>
                            <input type="text" id="form-cost" class="money-input" inputmode="decimal" placeholder="0.00"/>
                        </div>
                        <div class="form-group" id="form-provider-group">
                            <label for="form-provider">Proveedor</label>
                            <select id="form-provider">
                                <option value="">Selecciona un proveedor</option>
                            </select>
                        </div>
                    </div>

                    <p id="batch-modal-error" class="modal-message"></p>
                    <div class="inventory-modal-actions">
                        <button id="batch-modal-confirm">Guardar</button>
                        <button id="batch-modal-cancel" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById("batch-search");
    const listEl = document.getElementById("batch-list");
    const addBatchBtn = document.getElementById("btn-add-batch");

    const modalEl = document.getElementById("batch-modal");
    const modalTitleEl = document.getElementById("batch-modal-title");
    const modalSubtitleEl = document.getElementById("batch-modal-subtitle");
    const modalErrorEl = document.getElementById("batch-modal-error");

    const productSearchGroup = document.getElementById("batch-product-search-group");
    const productSearchInput = document.getElementById("batch-product-search");
    const productResultsEl = document.getElementById("batch-product-results");

    const formLot = document.getElementById("form-lot");
    const formQty = document.getElementById("form-qty");
    const formCost = document.getElementById("form-cost");
    const formExpiration = document.getElementById("form-expiration");
    const formSellPrice = document.getElementById("form-sell-price");
    const formProvider = document.getElementById("form-provider");
    const formSellPriceGroup = document.getElementById("form-sell-price-group");
    const formCostGroup = document.getElementById("form-cost-group");
    const formProviderGroup = document.getElementById("form-provider-group");

    const confirmBtn = document.getElementById("batch-modal-confirm");
    const cancelBtn = document.getElementById("batch-modal-cancel");

    let selectedProduct = null; // solo al agregar

    async function loadProviders() {
        try {
            providers = await getProviders();
            formProvider.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            providers.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = p.name;
                formProvider.appendChild(opt);
            });
        } catch (e) {
            console.error("Error cargando proveedores:", e);
        }
    }

    async function loadBatches() {
        const query = searchInput.value.trim();
        try {
            const batches = await searchBatches(query);
            if (!batches.length) {
                listEl.innerHTML = `<p>Sin resultados.</p>`;
                return;
            }
            listEl.innerHTML = `
                <div class="inventory-table">
                    <div class="inventory-header">
                        <div>Producto</div>
                        <div>Fórmula</div>
                        <div>Laboratorio</div>
                        <div>Lote</div>
                        <div>Cantidad</div>
                        <div>Caducidad</div>
                        <div>Acciones</div>
                    </div>
                    ${batches.map(b => `
                        <div class="inventory-row" data-batch-id="${b.id}">
                            <div>${b.product_name || "—"}</div>
                            <div>${b.formula || "—"}</div>
                            <div>${b.lab_name || "—"}</div>
                            <div>${b.lot || "—"}</div>
                            <div>${b.qty}</div>
                            <div>${b.expiration_date || "—"}</div>
                            <div class="inventory-actions">
                                <button class="btn-batch-edit">Editar</button>
                                <button class="btn-batch-delete">Eliminar</button>
                            </div>
                        </div>
                    `).join("")}
                </div>`;

            listEl.querySelectorAll(".btn-batch-edit").forEach(btn => {
                const batchId = Number(btn.closest(".inventory-row").dataset.batchId);
                const batch = batches.find(b => b.id === batchId);
                btn.addEventListener("click", () => openEditModal(batch));
            });

            listEl.querySelectorAll(".btn-batch-delete").forEach(btn => {
                const batchId = Number(btn.closest(".inventory-row").dataset.batchId);
                btn.addEventListener("click", () => handleDelete(batchId));
            });

        } catch (e) {
            listEl.innerHTML = `<p class="error">Error al cargar lotes: ${e.message}</p>`;
        }
    }

    function openEditModal(batch) {
        selectedBatch = batch;
        currentMode = "edit";
        modalTitleEl.textContent = "Editar Lote";
        modalSubtitleEl.textContent = batch.product_name || "";
        productSearchGroup.classList.add("hidden");
        formSellPriceGroup.classList.add("hidden");
        formCostGroup.classList.add("hidden");
        formProviderGroup.classList.add("hidden");
        formLot.value = batch.lot || "";
        formQty.value = batch.qty;
        formExpiration.value = batch.expiration_date || "";
        clearModalMessage();
        modalEl.classList.remove("hidden");
    }

    function openAddModal() {
        selectedBatch = null;
        selectedProduct = null;
        currentMode = "add";
        modalTitleEl.textContent = "Agregar Lote";
        modalSubtitleEl.textContent = "";
        productSearchGroup.classList.remove("hidden");
        formSellPriceGroup.classList.remove("hidden");
        formCostGroup.classList.remove("hidden");
        formProviderGroup.classList.remove("hidden");
        productSearchInput.value = "";
        productResultsEl.innerHTML = "";
        formLot.value = "";
        formQty.value = "";
        formCost.value = "";
        formExpiration.value = "";
        formSellPrice.value = "";
        formProvider.value = "";
        clearModalMessage();
        modalEl.classList.remove("hidden");
    }

    // Búsqueda de producto dentro del modal de agregar
    async function handleProductSearch() {
        const query = productSearchInput.value.trim();
        if (!query) {
            productResultsEl.innerHTML = "";
            return;
        }
        try {
            const products = await searchInventory(query);
            if (!products.length) {
                productResultsEl.innerHTML = `<p>Sin resultados.</p>`;
                return;
            }
            productResultsEl.innerHTML = products.map((p, i) => `
                <div class="result-row" data-index="${i}" style="cursor:pointer;padding:6px 8px;border-bottom:1px solid #eee;">
                    <strong>${p.name}</strong> <small>${p.formula || ""}</small>
                    <small style="float:right">${p.lab_name || ""}</small>
                </div>
            `).join("");

            productResultsEl.querySelectorAll(".result-row").forEach((row, i) => {
                row.addEventListener("click", () => {
                    selectedProduct = products[i];
                    productSearchInput.value = selectedProduct.name;
                    productResultsEl.innerHTML = "";
                    formCost.value = selectedProduct.cost || "";
                    formSellPrice.value = selectedProduct.price_sell || "";
                    formProvider.value = selectedProduct.provider_id ? String(selectedProduct.provider_id) : "";
                    modalSubtitleEl.textContent = selectedProduct.name;
                });
            });
        } catch (e) {
            productResultsEl.innerHTML = `<p class="error">Error al buscar.</p>`;
        }
    }

    function closeModal() {
        modalEl.classList.add("hidden");
        selectedBatch = null;
        selectedProduct = null;
        currentMode = null;
    }

    async function handleDelete(batchId) {
        if (!confirm("¿Eliminar este lote?")) return;
        try {
            await deleteProductBatch(batchId);
            await loadBatches();
        } catch (e) {
            alert(e.message || "Error al eliminar el lote");
        }
    }

    async function handleConfirm() {
        clearModalMessage();
        try {
            if (currentMode === "edit") {
                const payload = {
                    qty: Number(formQty.value),
                    lot: formLot.value.trim(),
                    expiration_date: formExpiration.value || null
                };
                await editProductBatch(selectedBatch.id, payload);
                closeModal();
                await loadBatches();
            }

            if (currentMode === "add") {
                if (!selectedProduct) {
                    showModalMessage("Selecciona un producto", "error");
                    return;
                }
                if (!formProvider.value) {
                    showModalMessage("Selecciona un proveedor", "error");
                    return;
                }
                const payload = {
                    product_id: selectedProduct.id,
                    quantity: Number(formQty.value),
                    unit_cost: Number(formCost.value),
                    sell_price: Number(formSellPrice.value),
                    provider_id: Number(formProvider.value),
                    lot: formLot.value.trim(),
                    expiration_date: formExpiration.value || null
                };
                await createInventoryRestock(payload);
                closeModal();
                await loadBatches();
            }
        } catch (e) {
            showModalMessage(e.message || "Error al guardar", "error");
        }
    }

    function showModalMessage(message, type = "error") {
        modalErrorEl.textContent = message;
        modalErrorEl.className = `modal-message ${type}`;
        if (feedbackTimeout) clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => {
            modalErrorEl.textContent = "";
            modalErrorEl.className = "modal-message";
        }, 2500);
    }

    function clearModalMessage() {
        if (feedbackTimeout) {
            clearTimeout(feedbackTimeout);
            feedbackTimeout = null;
        }
        modalErrorEl.textContent = "";
        modalErrorEl.className = "modal-message";
    }

    searchInput.addEventListener("input", loadBatches);
    addBatchBtn.addEventListener("click", openAddModal);
    productSearchInput.addEventListener("input", handleProductSearch);
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", closeModal);

    await loadProviders();
    await loadBatches();
}
