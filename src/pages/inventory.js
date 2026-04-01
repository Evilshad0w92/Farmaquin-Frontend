import { searchInventory, createInventoryAdjustment,createInventoryRestock, createItemProduct} from "../api/inventory";
import { getProviders, getSections, getLabNames } from "../api/getLists";

export async function renderInventory(container) {
    let products = [];
    let providers = [];
    let sections = [];
    let labNames = [];
    let selectedProduct = null;

    container.innerHTML = `
        <div class="page">
            <h2>Inventario</h2>

            <div class="inventory-toolbar card">
                <div class="inventory-filters">
                    <div>
                        <label for="inventory-search">Buscar:</label>
                        <input type="text" id="inventory-search" placeholder="Busqueda"/>
                        
                    </div>

                    <div class = "inventory-modal-actions">
                        <div class="inventory-actions">
                            <button id="btn-create">Nuevo Producto</button>
                        </div>
                    </div>
                    <lable>
                        <input type="checkbox" id="low-stock-filter"/>
                        Productos por agotarse
                    </lable>
                </div>
            </div>
            <div id="inventory-list" class="inventory-list">
                <p>Sin resultados.</p>
            </div>
            <div class = "inventory-modal hidden" id = "inventory-modal">
                <div class = "inventory-modal-content">
                    <h3 id = "modal-modal-title">Movimiento</h3>
                    <p id = "inventory-product-label"></p>

                    <div id = "adjustment-fields" class = "form-grid">
                        <div class = "form-group">
                            <label for="adjustment-type">Tipo</label>
                            <select id="adjustment-type">
                                <option value="SALIDA">Salida</option>
                                <option value="ENTRADA">Entrada</option>
                            </select>
                        </div>

                        <div class = "form-group">
                            <label for="adjustment-quantity">Cantidad</label>
                            <input type="number" id="adjustment-quantity" min="1"/>
                        </div>

                        <div class = "form-group full">
                            <label for="adjustment-reason">Motivo</label>
                            <input type="text" id="adjustment-reason" placeholder="Motivo del movimiento"/>
                        </div>
                    </div>

                    <div id = "restock-fields" class = "form-grid hidden">
                        <div class = "form-group">
                            <label for="restock-quantity">Cantidad</label>
                            <input type="number" id="restock-quantity" min="1"/>
                        </div>

                        <div class = "form-group">
                            <label for = "restock-unit-cost">Costo unitario</label>
                            <input type="text" id="restock-unit-cost" class="money-input" inputmode="decimal" placeholder="0.00" />
                        </div>

                        <div class = "form-group">
                            <label for = "restock-sell-price">Precio de venta</label>
                            <input type="text" id="restock-sell-price" class="money-input" inputmode="decimal" placeholder="0.00" />
                        </div>

                        <div class = "form-group">
                            <label for="restock-provider">Proveedor</label>
                            <select id="restock-provider">
                                <option value="">Selecciona un proveedor</option>
                            </select>
                        </div>
                    </div>

                    <div id = "new-product-fields" class = "form-grid hidden">
                        <div class = "from-group">
                            <label for="new-product-">Codigo de barras</label></br>
                            <input type="text" id="new-product-barcode" placeholder="Codigo de barras"/>
                        </div>

                        <div class = "form-group">
                            <label for="new-product-name">Nombre</label>
                            <input type="text" id="new-product-name" placeholder="Nombre del producto"/>
                        </div>

                        <div class = "from-group">
                            <label for="new-product-formula">Formula</label></br>
                            <input type="text" id="new-product-formula" placeholder="Formula del producto"/>
                        </div>

                        <div class = "from-group">
                            <label for="new-product-lab">Laboratorio</label>
                            <input type="text" id="new-product-lab" list="new-product-lab-list" placeholder="Laboratorio" />
                            <datalist id="new-product-lab-list"></datalist>
                        </div>
                        
                        <div class = "from-group">
                            <label for="new-product-method">Via</label></br>
                            <input type="text" id="new-product-method" placeholder="Via de administracion"/>
                        </div>

                        <div class = "from-group">
                            <label for="new-product-cost">Costo de Compra</label>
                            <input type="number" id="new-product-cost" min="0" placeholder="$0.00"/>
                        </div>
                        
                        <div class = "from-group">
                            <label for="new-product-price">Precio de Venta</label>
                            <input type="number" id="new-product-price" min="0" placeholder="$0.00"/>
                        </div>

                        <div class = "form-group">
                            <label for="new-product-stock">Stock</label>
                            <input type="number" id="new-product-stock" min="0" placeholder="Cantidad en stock"/>
                        </div>
                        
                        <div class = "form-group">
                            <label for="new-product-minStock">Stock minimo</label>
                            <input type="number" id="new-product-minStock" min="0" placeholder="Minimo de stock"/>
                        </div>

                        <div class = "from-group">
                            <label for="new-product-section">Seccion</label></br>
                            <select id="new-product-section">
                                <option value="">Selecciona una Seccion</option>
                            </select>
                        </div>

                        <div class = "from-group">
                            <label for="new-product-provider">Proveedor</label></br>
                            <select id="new-product-provider">
                                <option value="">Selecciona un Proveedor</option>
                            </select>
                        </div>
                    </div>

                    <p id = "inventory-modal-error" class = "login-error"></p>
                    <div class = "inventory-modal-actions">
                        <button id = "modal-confirm-btn">Confirmar</button>
                        <button id = "modal-cancel-btn" class="btn btn-secondary">Cancelar</button>
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
    const adjustmentTypeEl = document.getElementById("adjustment-type");
    const adjustmentQuantityInputEl = document.getElementById("adjustment-quantity");
    const adjustmentReasonInputEl = document.getElementById("adjustment-reason");
    const restockQuantityEl = document.getElementById("restock-quantity");
    const restockUnitCostEl = document.getElementById("restock-unit-cost");
    const restockSellPriceEl = document.getElementById("restock-sell-price");
    const restockProviderEl = document.getElementById("restock-provider");
    const createBarcodeEl = document.getElementById("new-product-barcode");
    const createNameEl = document.getElementById("new-product-name");
    const createFormulaEl = document.getElementById("new-product-formula");
    const createLabEl = document.getElementById("new-product-lab");
    const createLabListEl = document.getElementById("new-product-lab-list");
    const createMethodEl = document.getElementById("new-product-method");
    const createCostEl = document.getElementById("new-product-cost");
    const createSellEl = document.getElementById("new-product-price");
    const createStockEl = document.getElementById("new-product-stock");
    const createMinStockEl = document.getElementById("new-product-minStock");
    const createSectionEl = document.getElementById("new-product-section");
    const createProviderEl = document.getElementById("new-product-provider");
    const createBtn = document.getElementById("btn-create")
    const confirmBtn = document.getElementById("modal-confirm-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");

    let currentMode = null;

    //Load the providers from the backend to fill the provider select on the restock modal
    async function loadLists() {
        try {
            providers =  await getProviders(); 
            sections = await getSections();
            labNames = await getLabNames();

            restockProviderEl.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            createProviderEl.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            providers.forEach(provider => {
                const option = document.createElement("option");
                option.value = provider.id;
                option.textContent = provider.name;
                restockProviderEl.appendChild(option);
                createProviderEl.appendChild(option);
            });

            createSectionEl.innerHTML = `<option value="">Selecciona una seccion</option>`;
            sections.forEach(section => {
                const option = document.createElement("option");
                option.value = section.id;
                option.textContent = section.name;
                createSectionEl.appendChild(option);
            })

            createLabListEl.innerHTML = "";
            labNames.forEach(lab => {
                const option = document.createElement("option");
                option.value = lab.lab_name;
                createLabListEl.appendChild(option);
            })

        } catch (error) {
            console.error("Error cargando listas:", error);
        }
    }

    //Loads the inventory products based on the search query and low stock filter
    async function loadInventory() {
        const query = searchInput.value.trim();
        const lowStock = lowStockCheckbox.checked;

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
                        <div>Acciones</div>
                    </div>

                    ${products.map((product, index) => `
                        <div class="inventory-row" data-index="${index}">
                            <div>${product.name}</div>
                            <div>${product.formula || ""}</div>
                            <div>${product.lab_name || ""}</div>
                            <div>${product.section_name || ""}</div>
                            <div>${product.stock}</div>
                            <div>$${product.price_sell}</div>
                            <div class="inventory-actions">
                                <button class="btn-adjust")">Editar</button>
                                <button class="btn-restock")">Resurtir</button>
                            </div>
                        </div>
                    `).join("")}
                </div>`;

                document.querySelectorAll(".btn-adjust").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const row = btn.closest(".inventory-row");
                        const index = Number(row.dataset.index);
                        openAdjustmentModal(products[index]);
                    });
                });

                document.querySelectorAll(".btn-restock").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const row = btn.closest(".inventory-row");
                        const index = Number(row.dataset.index);
                        openRestockModal(products[index]);
                    });
                });

        } catch (error) {
            listEl.innerHTML = `<p class="error">Error cargando inventario: ${error.message}</p>`;
        }        
    }
    
    //Initial load of inventory and providers
    function openAdjustmentModal(product) {
        selectedProduct = product;
        currentMode = "adjustment";
        modalTitleEl.textContent = "Ajuste de inventario";
        productLabelEl.textContent = `${product.name} | Stock actual: ${product.stock}`;
        adjustmentFields.classList.remove("hidden");
        restockFields.classList.add("hidden");
        newProductFields.classList.add("hidden");
        adjustmentTypeEl.value = "SALIDA";
        adjustmentQuantityInputEl.value = "";
        adjustmentReasonInputEl.value = "";
        modalErrorEl.textContent = "";
        modalEl.classList.remove("hidden");
    }   

    //Opens the modal to create a restock movement for the selected product
    function openRestockModal(product) {
        selectedProduct = product;
        currentMode = "restock";
        modalTitleEl.textContent = "Reabastecer producto";
        productLabelEl.textContent = `${product.name} | Stock actual: ${product.stock}`;
        adjustmentFields.classList.add("hidden");
        newProductFields.classList.add("hidden");
        restockFields.classList.remove("hidden");
        restockQuantityEl.value = "";
        restockUnitCostEl.value = product.cost;
        restockSellPriceEl.value = product.price_sell;
        restockProviderEl.value = product.provider_name ? providers.find(p => p.name === product.provider_name)?.id || "" : "";
        modalErrorEl.textContent = "";
        modalEl.classList.remove("hidden");
    }

    function openNewProductModal(){
        currentMode = "create";
        modalTitleEl.textContent = "Nuevo producto";
        newProductFields.classList.remove("hidden");
        restockFields.classList.add("hidden");
        adjustmentFields.classList.add("hidden");
        modalEl.classList.remove("hidden");
        selectedProduct = null;
        productLabelEl.textContent = "";    
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
        modalErrorEl.textContent = "";

    }

    function closeModal() {
        selectedProduct = null;
        currentMode = null;
        modalEl.classList.add("hidden");
    }
    
    //Handles the confirm button click on the modal, creating either an adjustment or restock based on the current mode
    async function handleConfirm() {

        modalErrorEl.textContent = "";
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
            }

            
            if (currentMode === "restock") {
                if (!selectedProduct) return;
                if (!restockProviderEl.value) {
                    modalErrorEl.textContent = "Selecciona un proveedor";
                    return;
                }

                const payload = {
                    product_id: selectedProduct.id,
                    quantity: Number(restockQuantityEl.value),
                    unit_cost: Number(restockUnitCostEl.value),
                    sell_price: Number(restockSellPriceEl.value),
                    provider_id: Number(restockProviderEl.value)
                };
                await createInventoryRestock(payload);
            }

            if (currentMode === "create"){
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
                    provider_id: Number(createProviderEl.value)
                }
                await createItemProduct(payload);
            }
            closeModal();
            await loadInventory();
        } catch (error) {
            modalErrorEl.textContent = error.message || "Error al procesar el movimiento";
        }
    }

    searchInput.addEventListener("input", loadInventory);
    lowStockCheckbox.addEventListener("change", loadInventory);
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", closeModal);
    createBtn.addEventListener("click", openNewProductModal);
    

    await loadLists();
    await loadInventory();
}