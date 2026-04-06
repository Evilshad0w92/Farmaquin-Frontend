import { searchProducts, scanProduct } from "../api/products";
import { createSale, getSaleTicket } from "../api/sales";
import { printTicket } from "../api/print";
import { formatDateMX } from "../utils/date";

export function renderPOS(container) {
    let cart = [];

    container.innerHTML = `
        <div class="page">
            <h2>Punto de Venta</h2>
            <div class="pos-layout">
                <div class="pos-left card">
                    <div>
                        <label for="search-input">Buscar producto</label>
                        <input type="text" id="search-input" placeholder="Buscar por nombre" />
                    </div>

                    <div class="pos-results" id="pos-results">
                        <p>Sin resultados</p>
                    </div>
                </div>

                <div class="pos-right card">
                    <div>
                        <label for="barcode-input">Código de barras</label>
                        <input type="text" id="barcode-input" class="barcode-input" placeholder="Escanea aquí" />

                        <label for="payment-method">Método de pago</label>
                        <select id="payment-method">
                            <option value="EFECTIVO" selected>Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                    </div>

                    <div class="cart-items" id="cart-items">
                        <p>No hay productos agregados</p>
                    </div>

                    <div class="form-row">
                        <label for="total-input">Total</label>
                        <input type="text" id="total-input" class="money-input readonly-display" value="0.00" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cash-input">Efectivo</label>
                        <input type="text" id="cash-input" class="money-input" inputmode="decimal" placeholder="0.00" />
                    </div>

                    <div class="form-row">
                        <label for="change-input">Cambio</label>
                        <input type="text" id="change-input" class="money-input readonly-display" value="0.00" readonly />
                    </div>

                    <div class="pos-actions">
                        <button id="btn-complete-sale">Aceptar</button>
                        <button id="btn-clear-cart" class="secondary">Limpiar</button>
                    </div>

                    <p id="pos-error" class="login-error"></p>
                </div>
            </div>
        </div>
    `;

    //Assing every input to a variable for easy use
    const searchInput = document.getElementById("search-input");
    const barcodeInput = document.getElementById("barcode-input");
    const paymentMethod = document.getElementById("payment-method");
    const cashInput = document.getElementById("cash-input");
    const totalInput = document.getElementById("total-input");
    const changeInput = document.getElementById("change-input");
    const resultsEl = document.getElementById("pos-results");
    const cartItemsEl = document.getElementById("cart-items");
    const clearBtn = document.getElementById("btn-clear-cart");
    const errorEl = document.getElementById("pos-error");
    const completeBtn = document.getElementById("btn-complete-sale");

    // Renders the cart items and updates totals
    function renderCart() {
        if (cart.length === 0) {
            cartItemsEl.innerHTML = `<p>No hay productos agregados</p>`;
            totalInput.value = "0.00";
            changeInput.value = "0.00";
            completeBtn.disabled = true;
            return;
        }

        cartItemsEl.innerHTML = cart.map((item, index) => `
            
            <div class="cart-row" data-index="${index}">
                <div>
                    <strong>${item.name}</strong><br/>
                    <small>${item.formula || ""}</small>
                    <small>Lab: ${item.lab_name || ""}</small>
                    <small>Via: ${item.method || ""}</small><br/>
                    <small>Precio: $${Number(item.unit_price).toFixed(2)}</small>
                    <small>Descuento: $${Number(item.discount_amount || 0).toFixed(2)}</small>
                    
                
                </div>
                <div>
                    <small>${item.quantity} x $${item.price_after_discount}</small><br/>
                    <strong>$${item.line_total}</strong>            
                   </div>
            </div>
        `).join("");

        //Event listener for removing items from the cart when clicking on a cart row
        document.querySelectorAll(".cart-row").forEach((row) => {
            row.addEventListener("click", () => {
                const index = Number(row.dataset.index);
                removeFromCart(index);
            });
        });

        const total = cart.reduce((sum, item) => {
            return sum + Number(item.line_total);
        }, 0);

        totalInput.value = total.toFixed(2);
        recalcChange();
    }

    // Recalculates the change based on payment method and cash input
    function recalcChange() {
        if (paymentMethod.value !== "EFECTIVO") {
            changeInput.value = "0.00";
            completeBtn.disabled = true;
            return;
        }

        const total = Number(totalInput.value || 0);
        const cash = Number(cashInput.value || 0);
        const change = cash - total;

        changeInput.value = change > 0 ? change.toFixed(2) : "0.00";

        if (cash < total) {
            completeBtn.disabled = true; 
        } else {
            completeBtn.disabled = false;
        }
    }

    // Adds a product to the cart or updates quantity if it already exists
    function addToCart(product) {
        const existing = cart.find((item) => item.id === product.id);

        if (existing) {
            existing.quantity += 1;
            existing.line_total = (
                Number(existing.price_after_discount) * existing.quantity
            ).toFixed(2);
        } else {
            cart.push({
                id: product.id,
                barcode: product.barcode,
                name: product.name,
                formula: product.formula,
                quantity: 1,
                unit_price: product.unit_price,
                discount_amount: product.discount_amount,
                price_after_discount: product.price_after_discount,
                line_total: product.line_total,
                lab_name: product.lab_name,
            });
        }

        renderCart();
    }

    // Handles product search based on input query
    async function handleSearch() {
        const query = searchInput.value.trim();
        errorEl.textContent = "";

        if (!query) {
            resultsEl.innerHTML = `<p>Sin resultados</p>`;
            return;
        }

        try {
            const products = await searchProducts(query);
            if (!products.length) {
                resultsEl.innerHTML = `<p>Sin resultados</p>`;
                return;
            }

            resultsEl.innerHTML = products.map((product) => `
                <div class="result-row" data-id="${product.id}">
                    <div>
                        <strong>${product.name}</strong><br/>
                        <small>${product.formula || ""}</small><br/>
                        <small>Lab: ${product.lab_name || ""}</small><br/>
                        <small>Ubicación: ${product.section_name || ""}</small><br/>
                        <small>Via: ${product.method || ""}</small>
                    </div>
                    <div>
                        <small>Disponible</small>
                        <strong>${product.stock}</strong><br/>
                        <small>Precio: </small>
                        <strong>$${product.price_sell}</strong>
                    </div>
                </div>
            `).join("");

            document.querySelectorAll(".result-row").forEach((row, index) => {
                row.addEventListener("click", () => {
                    const product = products[index];

                    const formattedProduct = {
                        id: product.id,
                        barcode: product.barcode,
                        name: product.name,
                        formula: product.formula,
                        quantity: 1,
                        unit_price: product.price_sell,
                        discount_amount: product.discount_value || "0.00",
                        price_after_discount: product.price_sell,
                        line_total: product.price_sell,
                        lab_name: product.lab_name,
                        section_name: product.section_name,
                    };

                    addToCart(formattedProduct);
                    barcodeInput.focus();
                });
            });

        } catch (error) {
            resultsEl.innerHTML = `<p>Sin resultados</p>`;
            errorEl.textContent = error.message || "Error al buscar productos";
        }
    }

    // Handles scanning a product by barcode
    async function handleScan() {
        const barcode = barcodeInput.value.trim();
        errorEl.textContent = "";

        if (!barcode) return;

        try {
            const product = await scanProduct(barcode, 1);
            addToCart(product);
            barcodeInput.value = "";
            barcodeInput.focus();
        } catch (error) {
            errorEl.textContent = error.message || "Error al escanear producto";
        }
    }

    // Handles completing the sale and creating a sale record
    async function handleCompleteSale() {
        errorEl.textContent = "";

        if (!cart.length) return;

        const payment_method = paymentMethod.value;
        const cash_received = Number(cashInput.value || 0);
        const total = Number(totalInput.value || 0);
        
        const payload = {
            items: cart.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
            })),
            cash_received: payment_method === "EFECTIVO" ? cash_received : 0,
            payment_method: payment_method,
        };
        
        try {
            const sale = await createSale(payload);
            const ticket = await getSaleTicket(sale.sale_id);
            const dateMX = formatDateMX(ticket.created_at);

            try {
                await printTicket(ticket);
            } catch (printError) {
                console.error("Error al imprimir el ticket:", printError);
                errorEl.textContent = `Venta realizada, pero no se pudo imprimir el ticket: ${printError.message || printError}`;
            }

            alert(`Venta realizada con éxito. Folio: ${sale.sale_id}`);

            cart = [];
            resultsEl.innerHTML = `<p>Sin resultados</p>`;
            searchInput.value = "";
            barcodeInput.value = "";
            cashInput.value = "";
            paymentMethod.value = "EFECTIVO";
            renderCart();
            barcodeInput.focus();
        } catch (error) {
            errorEl.textContent = error.message || "Error al completar la venta";
        }
    }

    // function for removing items from the cart
    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
    }   

    // Event listeners for search input, barcode scanning, payment method changes, complete sale,and clearing the cart
    searchInput.addEventListener("input", async () => {
        await handleSearch();
    });

    barcodeInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            await handleScan();
        }
    });

    completeBtn.addEventListener("click", async () => {
        await handleCompleteSale();
    }); 
    cashInput.addEventListener("input", recalcChange);
    paymentMethod.addEventListener("change", recalcChange);

    clearBtn.addEventListener("click", () => {
        cart = [];
        resultsEl.innerHTML = `<p>Sin resultados</p>`;
        searchInput.value = "";
        barcodeInput.value = "";
        cashInput.value = "";
        errorEl.textContent = "";
        renderCart();
    });

    renderCart();
}