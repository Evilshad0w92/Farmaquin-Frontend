import { searchInventory, createInventoryAdjustment, createInventoryRestock, createItemProduct, editItemProduct, getProductByBarcode } from "../api/inventory";
import { getProviders, getSections, getLabNames, getMethodNames } from "../api/getLists";
import { getUser } from "../utils/storage";


export async function renderInventory(container) {
    let products = [];
    let providers = [];
    let sections = [];
    let labNames = [];
    let selectedProduct = null;
    let feedbackTimeout = null;

    const user = getUser();
    const newButton = user && [1, 2].includes(user.role_id) ? `
        <div class="inventory-modal-actions">
            <div class="inventory-actions">
                <button id="btn-create">Nuevo Producto</button>
                <button data-page="batches">Lotes</button>
            </div>
        </div>
    ` : "";

    container.innerHTML = `
        <div class="page">
            <h2>Inventario</h2>

            <div class="inventory-toolbar card">
                <div class="inventory-filters">
                    <div>
                        <label for="inventory-search">Buscar:</label>
                        <input type="text" id="inventory-search" placeholder="Busqueda"/>
                    </div>
                    ${newButton}
                    <label>
                        <input type="checkbox" id="low-stock-filter"/>
                        Productos por agotarse
                    </label>
                </div>
            </div>

            <div id="inventory-list" class="inventory-list">
                <p>Sin resultados.</p>
            </div>

            <div class="inventory-modal hidden" id="inventory-modal">
                <div class="inventory-modal-content">
                    <h3 id="modal-modal-title">Movimiento</h3>
                    <p id="inventory-product-label"></p>

                    <!-- Ajuste -->
                    <div id="adjustment-fields" class="form-grid">
                        <div class="form-group">
                            <label for="adjustment-type">Tipo</label>
                            <select id="adjustment-type">
                                <option value="SALIDA">Salida</option>
                                <option value="ENTRADA">Entrada</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="adjustment-quantity">Cantidad</label>
                            <input type="number" id="adjustment-quantity" min="1"/>
                        </div>
                        <div class="form-group full">
                            <label for="adjustment-reason">Motivo</label>
                            <input type="text" id="adjustment-reason" placeholder="Motivo del movimiento"/>
                        </div>
                    </div>

                    <!-- Resurtir -->
                    <div id="restock-fields" class="form-grid hidden">
                        <div class="form-group">
                            <label for="restock-quantity">Cantidad</label>
                            <input type="number" id="restock-quantity" min="1"/>
                        </div>
                        <div class="form-group">
                            <label for="restock-unit-cost">Costo unitario</label>
                            <input type="text" id="restock-unit-cost" class="money-input" inputmode="decimal" placeholder="0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="restock-sell-price">Precio de venta</label>
                            <input type="text" id="restock-sell-price" class="money-input" inputmode="decimal" placeholder="0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="restock-provider">Proveedor</label>
                            <select id="restock-provider">
                                <option value="">Selecciona un proveedor</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="restock-lot">Lote</label>
                            <input type="text" id="restock-lot" placeholder="Número de lote"/>
                        </div>
                        <div class="form-group">
                            <label for="restock-expiration">Fecha de caducidad</label>
                            <input type="date" id="restock-expiration"/>
                        </div>
                    </div>

                    <!-- Nuevo producto -->
                    <div id="new-product-fields" class="form-grid hidden">
                        <div class="form-group">
                            <label for="new-product-barcode">Codigo de barras</label>
                            <input type="text" id="new-product-barcode" placeholder="Codigo de barras"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-name">Nombre</label>
                            <input type="text" id="new-product-name" placeholder="Nombre del producto"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-formula">Formula</label>
                            <input type="text" id="new-product-formula" placeholder="Formula del producto"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-lab">Laboratorio</label>
                            <input type="text" id="new-product-lab" list="new-product-lab-list" placeholder="Laboratorio"/>
                            <datalist id="new-product-lab-list"></datalist>
                        </div>
                        <div class="form-group">
                            <label for="new-product-method">Via</label>
                            <input type="text" id="new-product-method" list="new-product-method-list" placeholder="Via de administracion"/>
                            <datalist id="new-product-method-list"></datalist>
                        </div>
                        <div class="form-group">
                            <label for="new-product-cost">Costo de Compra</label>
                            <input type="number" id="new-product-cost" min="0" placeholder="$0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-price">Precio de Venta</label>
                            <input type="number" id="new-product-price" min="0" placeholder="$0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-stock">Stock</label>
                            <input type="number" id="new-product-stock" min="0" placeholder="Cantidad en stock"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-minStock">Stock minimo</label>
                            <input type="number" id="new-product-minStock" min="0" placeholder="Minimo de stock"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-section">Seccion</label>
                            <select id="new-product-section">
                                <option value="">Selecciona una Seccion</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="new-product-provider">Proveedor</label>
                            <select id="new-product-provider">
                                <option value="">Selecciona un Proveedor</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="new-product-lot">Lote</label>
                            <input type="text" id="new-product-lot" placeholder="Número de lote"/>
                        </div>
                        <div class="form-group">
                            <label for="new-product-expiration">Fecha de caducidad</label>
                            <input type="date" id="new-product-expiration"/>
                        </div>
                        <div class="form-group full">
                            <label for="new-product-content">Contenido</label>
                            <input type="text" id="new-product-content" placeholder="Ej. 10 tabletas, 30ml, etc."/>
                        </div>
                        <div class="form-group full checkbox-group">
                            <input type="checkbox" id="new-product-is-service" />
                            <label for="new-product-is-service">Es servicio (no descuenta stock)</label>
                        </div>
                    </div>

                    <!-- Editar producto -->
                    <div id="edit-product-fields" class="form-grid hidden">
                        <div class="form-group">
                            <label for="edit-product-name">Nombre</label>
                            <input type="text" id="edit-product-name" placeholder="Nombre del producto"/>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-formula">Formula</label>
                            <input type="text" id="edit-product-formula" placeholder="Formula del producto"/>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-lab">Laboratorio</label>
                            <input type="text" id="edit-product-lab" list="edit-product-lab-list" placeholder="Laboratorio"/>
                            <datalist id="edit-product-lab-list"></datalist>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-method">Via</label>
                            <input type="text" id="edit-product-method" list="edit-product-method-list" placeholder="Via de administracion"/>
                            <datalist id="edit-product-method-list"></datalist>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-cost">Costo de Compra</label>
                            <input type="number" id="edit-product-cost" min="0" placeholder="$0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-price">Precio de Venta</label>
                            <input type="number" id="edit-product-price" min="0" placeholder="$0.00"/>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-minStock">Stock minimo</label>
                            <input type="number" id="edit-product-minStock" min="0" placeholder="Minimo de stock"/>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-section">Seccion</label>
                            <select id="edit-product-section">
                                <option value="">Selecciona una Seccion</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-provider">Proveedor</label>
                            <select id="edit-product-provider">
                                <option value="">Selecciona un Proveedor</option>
                            </select>
                        </div>
                        <div class="form-group full">
                            <label for="edit-product-content">Contenido</label>
                            <input type="text" id="edit-product-content" placeholder="Ej. 10 tabletas, 30ml, etc."/>
                        </div>
                        <div class="form-group full checkbox-group">
                            <input type="checkbox" id="edit-product-is-service" />
                            <label for="edit-product-is-service">Es servicio (no descuenta stock)</label>
                        </div>
                    </div>

                    <p id="inventory-modal-error" class="modal-message"></p>
                    <div class="inventory-modal-actions">
                        <button id="modal-confirm-btn">Confirmar</button>
                        <button id="modal-cancel-btn" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById("inventory-search");
    const lowStockCheckbox = document.getElementById("low-stock-filter");
    const listEl = document.getElementById("inventory-list");
    const modalEl = document.getElementById("inventory-modal");
    const modalTitleEl = document.getElementById("modal-modal-title");
    const productLabelEl = document.getElementById("inventory-product-label");
    const modalErrorEl = document.getElementById("inventory-modal-error");
    const adjustmentFields = document.getElementById("adjustment-fields");
    const restockFields = document.getElementById("restock-fields");
    const newProductFields = document.getElementById("new-product-fields");
    const editProductFields = document.getElementById("edit-product-fields");

    const adjustmentTypeEl = document.getElementById("adjustment-type");
    const adjustmentQuantityInputEl = document.getElementById("adjustment-quantity");
    const adjustmentReasonInputEl = document.getElementById("adjustment-reason");

    const restockQuantityEl = document.getElementById("restock-quantity");
    const restockUnitCostEl = document.getElementById("restock-unit-cost");
    const restockSellPriceEl = document.getElementById("restock-sell-price");
    const restockProviderEl = document.getElementById("restock-provider");
    const restockLotEl = document.getElementById("restock-lot");
    const restockExpirationEl = document.getElementById("restock-expiration");

    const createBarcodeEl = document.getElementById("new-product-barcode");
    const createNameEl = document.getElementById("new-product-name");
    const createFormulaEl = document.getElementById("new-product-formula");
    const createLabEl = document.getElementById("new-product-lab");
    const createLabListEl = document.getElementById("new-product-lab-list");
    const createMethodEl = document.getElementById("new-product-method");
    const createMethodListEl = document.getElementById("new-product-method-list");
    const createCostEl = document.getElementById("new-product-cost");
    const createSellEl = document.getElementById("new-product-price");
    const createStockEl = document.getElementById("new-product-stock");
    const createMinStockEl = document.getElementById("new-product-minStock");
    const createSectionEl = document.getElementById("new-product-section");
    const createProviderEl = document.getElementById("new-product-provider");
    const createLotEl = document.getElementById("new-product-lot");
    const createExpirationEl = document.getElementById("new-product-expiration");
    const createContentEl = document.getElementById("new-product-content");
    const createIsServiceEl = document.getElementById("new-product-is-service");
    const createBtn = document.getElementById("btn-create");

    const editNameEl = document.getElementById("edit-product-name");
    const editFormulaEl = document.getElementById("edit-product-formula");
    const editLabEl = document.getElementById("edit-product-lab");
    const editLabListEl = document.getElementById("edit-product-lab-list");
    const editMethodEl = document.getElementById("edit-product-method");
    const editMethodListEl = document.getElementById("edit-product-method-list");
    const editCostEl = document.getElementById("edit-product-cost");
    const editSellEl = document.getElementById("edit-product-price");
    const editMinStockEl = document.getElementById("edit-product-minStock");
    const editSectionEl = document.getElementById("edit-product-section");
    const editProviderEl = document.getElementById("edit-product-provider");
    const editContentEl = document.getElementById("edit-product-content");
    const editIsServiceEl = document.getElementById("edit-product-is-service");

    const confirmBtn = document.getElementById("modal-confirm-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");

    let currentMode = null;

    function hideAllFields() {
        adjustmentFields.classList.add("hidden");
        restockFields.classList.add("hidden");
        newProductFields.classList.add("hidden");
        editProductFields.classList.add("hidden");
    }

    async function loadLists() {
        try {
            [providers, sections, labNames] = await Promise.all([
                getProviders(), getSections(), getLabNames()
            ]);

            restockProviderEl.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            createProviderEl.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            editProviderEl.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            providers.forEach(provider => {
                [restockProviderEl, createProviderEl, editProviderEl].forEach(sel => {
                    const opt = document.createElement("option");
                    opt.value = provider.id;
                    opt.textContent = provider.name;
                    sel.appendChild(opt);
                });
            });

            createSectionEl.innerHTML = `<option value="">Selecciona una seccion</option>`;
            editSectionEl.innerHTML = `<option value="">Selecciona una seccion</option>`;
            sections.forEach(section => {
                [createSectionEl, editSectionEl].forEach(sel => {
                    const opt = document.createElement("option");
                    opt.value = section.id;
                    opt.textContent = section.name;
                    sel.appendChild(opt);
                });
            });

            createLabListEl.innerHTML = "";
            editLabListEl.innerHTML = "";
            labNames.forEach(lab => {
                [createLabListEl, editLabListEl].forEach(dl => {
                    const opt = document.createElement("option");
                    opt.value = lab.lab_name;
                    dl.appendChild(opt);
                });
            });

            // Load method (via) suggestions — fetched after other lists since less critical
            getMethodNames().then(methods => {
                createMethodListEl.innerHTML = "";
                editMethodListEl.innerHTML = "";
                methods.forEach(m => {
                    [createMethodListEl, editMethodListEl].forEach(dl => {
                        const opt = document.createElement("option");
                        opt.value = m.method;
                        dl.appendChild(opt);
                    });
                });
            }).catch(() => {});

        } catch (error) {
            console.error("Error cargando listas:", error);
        }
    }

    async function loadInventory() {
        const query = searchInput.value.trim();
        const lowStock = lowStockCheckbox.checked;
        const user = getUser();

        const adjustButtons = user && [1, 2].includes(user.role_id) ? `
            <div class="inventory-actions">
                <button class="btn-edit">Editar</button>
                <button class="btn-adjust">Ajuste</button>
                <button class="btn-restock">Resurtir</button>
            </div>
        ` : "";

        const actionDiv = user && [1, 2].includes(user.role_id) ? `<div>Acciones</div>` : "";

        try {
            products = await searchInventory(query, lowStock);
            if (!products.length) {
                listEl.innerHTML = `<p>Sin resultados.</p>`;
                return;
            }

            listEl.innerHTML = `
                <div class="inventory-table">
                    <div class="inventory-header">
                        <div>Descripción</div>
                        <div>Formula</div>
                        <div>Laboratorio</div>
                        <div>Ubicacion</div>
                        <div>Stock</div>
                        <div>Precio</div>
                        ${actionDiv}
                    </div>
                    ${products.map((product, index) => `
                        <div class="inventory-row" data-index="${index}">
                            <div>
                                ${product.name}
                                ${product.content ? `<br/><small>${product.content}</small>` : ""}
                            </div>
                            <div>${product.formula || ""}</div>
                            <div>${product.lab_name || ""}</div>
                            <div>${product.section_name || ""}</div>
                            <div>${product.stock}</div>
                            <div>$${product.price_sell}</div>
                            ${adjustButtons}
                        </div>
                    `).join("")}
                </div>`;

            document.querySelectorAll(".btn-adjust").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const index = Number(btn.closest(".inventory-row").dataset.index);
                    openAdjustmentModal(products[index]);
                });
            });

            document.querySelectorAll(".btn-restock").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const index = Number(btn.closest(".inventory-row").dataset.index);
                    openRestockModal(products[index]);
                });
            });

            document.querySelectorAll(".btn-edit").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const index = Number(btn.closest(".inventory-row").dataset.index);
                    openEditProductModal(products[index]);
                });
            });

        } catch (error) {
            listEl.innerHTML = `<p class="error">Error cargando inventario: ${error.message}</p>`;
        }
    }

    function openAdjustmentModal(product) {
        selectedProduct = product;
        currentMode = "adjustment";
        modalTitleEl.textContent = "Ajuste de inventario";
        productLabelEl.textContent = `${product.name} | Stock actual: ${product.stock}`;
        hideAllFields();
        adjustmentFields.classList.remove("hidden");
        adjustmentTypeEl.value = "SALIDA";
        adjustmentQuantityInputEl.value = "";
        adjustmentReasonInputEl.value = "";
        confirmBtn.textContent = "Confirmar";
        cancelBtn.textContent = "Cancelar";
        clearModalMessage();
        modalEl.classList.remove("hidden");
    }

    function openRestockModal(product) {
        selectedProduct = product;
        currentMode = "restock";
        modalTitleEl.textContent = "Reabastecer producto";
        productLabelEl.textContent = `${product.name} | Stock actual: ${product.stock}`;
        hideAllFields();
        restockFields.classList.remove("hidden");
        restockQuantityEl.value = "";
        restockUnitCostEl.value = product.cost;
        restockSellPriceEl.value = product.price_sell;
        restockProviderEl.value = product.provider_id ? String(product.provider_id) : "";
        restockLotEl.value = "";
        restockExpirationEl.value = "";
        confirmBtn.textContent = "Confirmar";
        cancelBtn.textContent = "Cancelar";
        clearModalMessage();
        modalEl.classList.remove("hidden");
    }

    function openNewProductModal() {
        currentMode = "create";
        selectedProduct = null;
        modalTitleEl.textContent = "Nuevo producto";
        productLabelEl.textContent = "";
        hideAllFields();
        newProductFields.classList.remove("hidden");
        createBarcodeEl.value = "";
        createNameEl.value = "";
        createFormulaEl.value = "";
        createLabEl.value = "";
        createMethodEl.value = "";
        createCostEl.value = "";
        createSellEl.value = "";
        createStockEl.value = "";
        createMinStockEl.value = "";
        createSectionEl.value = "";
        createProviderEl.value = "";
        createLotEl.value = "";
        createExpirationEl.value = "";
        createContentEl.value = "";
        createIsServiceEl.checked = false;
        confirmBtn.textContent = "Crear";
        cancelBtn.textContent = "Cancelar";
        clearModalMessage();
        modalEl.classList.remove("hidden");
        setTimeout(() => createBarcodeEl.focus(), 50);
    }

    function openEditProductModal(product) {
        selectedProduct = product;
        currentMode = "edit";
        modalTitleEl.textContent = "Editar producto";
        productLabelEl.textContent = "";
        hideAllFields();
        editProductFields.classList.remove("hidden");
        editNameEl.value = product.name;
        editFormulaEl.value = product.formula;
        editLabEl.value = product.lab_name;
        editMethodEl.value = product.method;
        editCostEl.value = product.cost;
        editSellEl.value = product.price_sell;
        editMinStockEl.value = product.min_stock;
        editProviderEl.value = String(product.provider_id ?? "");
        editSectionEl.value = String(product.section_id ?? "");
        editContentEl.value = product.content || "";
        editIsServiceEl.checked = product.is_service || false;
        confirmBtn.textContent = "Guardar";
        cancelBtn.textContent = "Cancelar";
        clearModalMessage();
        modalEl.classList.remove("hidden");
    }

    function closeModal() {
        selectedProduct = null;
        currentMode = null;
        modalEl.classList.add("hidden");
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

    async function handleConfirm() {
        clearModalMessage();
        try {
            if (currentMode === "adjustment") {
                if (!selectedProduct) return;
                const payload = {
                    product_id: selectedProduct.id,
                    adjustment_type: adjustmentTypeEl.value,
                    quantity: Number(adjustmentQuantityInputEl.value),
                    reason: adjustmentReasonInputEl.value.trim()
                };
                await createInventoryAdjustment(payload);
                closeModal();
                await loadInventory();
            }

            if (currentMode === "restock") {
                if (!selectedProduct) return;
                if (!restockProviderEl.value) {
                    showModalMessage("Selecciona un proveedor", "error");
                    return;
                }
                const payload = {
                    product_id: selectedProduct.id,
                    quantity: Number(restockQuantityEl.value),
                    unit_cost: Number(restockUnitCostEl.value),
                    sell_price: Number(restockSellPriceEl.value),
                    provider_id: Number(restockProviderEl.value),
                    lot: restockLotEl.value.trim(),
                    expiration_date: restockExpirationEl.value || null
                };
                await createInventoryRestock(payload);
                closeModal();
                await loadInventory();
            }

            if (currentMode === "create") {
                const payload = {
                    barcode: createBarcodeEl.value.trim(),
                    name: createNameEl.value.trim(),
                    formula: createFormulaEl.value.trim(),
                    lab_name: createLabEl.value.trim(),
                    method: createMethodEl.value.trim(),
                    unit_cost: Number(createCostEl.value),
                    sell_price: Number(createSellEl.value),
                    stock: Number(createStockEl.value),
                    min_stock: Number(createMinStockEl.value),
                    section_id: Number(createSectionEl.value),
                    provider_id: Number(createProviderEl.value),
                    lot: createLotEl.value.trim(),
                    expiration_date: createExpirationEl.value || null,
                    content: createContentEl.value.trim() || null,
                    is_service: createIsServiceEl.checked
                };
                await createItemProduct(payload);
                openNewProductModal();
                showModalMessage("Producto creado correctamente", "success");
            }

            if (currentMode === "edit") {
                const payload = {
                    product_id: selectedProduct.id,
                    name: editNameEl.value.trim(),
                    formula: editFormulaEl.value.trim(),
                    lab_name: editLabEl.value.trim(),
                    method: editMethodEl.value.trim(),
                    unit_cost: Number(editCostEl.value),
                    sell_price: Number(editSellEl.value),
                    min_stock: Number(editMinStockEl.value),
                    section_id: Number(editSectionEl.value),
                    provider_id: Number(editProviderEl.value),
                    content: editContentEl.value.trim() || null,
                    is_service: editIsServiceEl.checked
                };
                await editItemProduct(payload);
                closeModal();
                await loadInventory();
            }

        } catch (error) {
            showModalMessage(error.message || "Error al procesar el movimiento", "error");
        }
    }

    // Shows a modal asking whether to restock an existing product instead of creating a duplicate
    function askRestockInstead(product) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "ticket-modal-overlay";
            overlay.innerHTML = `
                <div class="ticket-modal">
                    <p class="ticket-modal-msg">Ya existe un producto con este código:</p>
                    <p style="font-weight:700;margin:6px 0">${product.name}</p>
                    <p style="font-size:13px;color:#6b7280">Stock actual: ${product.stock}</p>
                    <p class="ticket-modal-msg" style="margin-top:10px">¿Deseas resurtirlo en lugar de crear uno nuevo?</p>
                    <div class="ticket-modal-actions">
                        <button id="ask-restock-yes">Sí, resurtir</button>
                        <button id="ask-restock-no" class="secondary">No, continuar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector("#ask-restock-yes").addEventListener("click", () => {
                overlay.remove();
                resolve(true);
            });
            overlay.querySelector("#ask-restock-no").addEventListener("click", () => {
                overlay.remove();
                resolve(false);
            });
        });
    }

    // Checks barcode on blur — if it already exists, offer to restock instead
    createBarcodeEl.addEventListener("blur", async () => {
        const barcode = createBarcodeEl.value.trim();
        if (!barcode) return;
        try {
            const existing = await getProductByBarcode(barcode);
            const wantsRestock = await askRestockInstead(existing);
            if (wantsRestock) {
                closeModal();
                openRestockModal(existing);
            }
        } catch {
            // 404 = barcode is new, let the user proceed with creation
        }
    });

    searchInput.addEventListener("input", loadInventory);
    lowStockCheckbox.addEventListener("change", loadInventory);
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", closeModal);
    if (createBtn) {
        createBtn.addEventListener("click", openNewProductModal);
    }

    await loadLists();
    await loadInventory();
}
