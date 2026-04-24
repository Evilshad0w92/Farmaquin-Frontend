import { previewCashCut, closeCashCut } from "../api/cashcut";
import { formatDateMX } from "../utils/date";
import { printTicket } from "../api/print";

export async function renderCashCut(container) {
    container.innerHTML = `
        <div class="page">
            <h2>Corte de Caja</h2>

            <div class="cashcut-layout">
            <div class="cashcut-card card">
                <div class="cashcut-grid">
                    <div class="form-row">
                        <label for="cashcut-from">Desde</label>
                        <input type="text" id="cashcut-from" class="readonly-display" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-to">Hasta</label>
                        <input type="text" id="cashcut-to" class="readonly-display" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-sales">Ventas netas</label>
                        <input type="text" id="cashcut-sales" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-sales-count">No. ventas</label>
                        <input type="text" id="cashcut-sales-count" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-returns">Devoluciones</label>
                        <input type="text" id="cashcut-returns" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-returns-count">No. devoluciones</label>
                        <input type="text" id="cashcut-returns-count" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-expenses">Gastos</label>
                        <input type="text" id="cashcut-expenses" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-expenses-count">No. gastos</label>
                        <input type="text" id="cashcut-expenses-count" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-cash">Efectivo ventas</label>
                        <input type="text" id="cashcut-cash" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-card">Tarjeta</label>
                        <input type="text" id="cashcut-card" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-transfer">Transferencia</label>
                        <input type="text" id="cashcut-transfer" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-expected">Efectivo esperado</label>
                        <input type="text" id="cashcut-expected" class="readonly-display money-input" readonly />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-counted">Efectivo contado</label>
                        <input type="text" id="cashcut-counted" class="money-input" min="0" placeholder="$0.00" />
                    </div>

                    <div class="form-row">
                        <label for="cashcut-difference">Diferencia</label>
                        <input type="text" id="cashcut-difference" class="readonly-display money-input" readonly value="$0.00" />
                    </div>

                    <div class="cashcut-comment-block">
                        <label for="cashcut-comment">Comentario</label>
                        <input type="text" id="cashcut-comment" placeholder="Observaciones del corte" />
                    </div>
                </div>

                <div class="cashcut-actions">
                    <button id="btn-save-cashcut">Aceptar</button>
                    <button id="btn-refresh-cashcut" class="secondary">Refrescar</button>
                    <button id="btn-clear-cashcut" class="secondary">Limpiar</button>
                </div>

                <p id="cashcut-error" class="login-error"></p>
                <p id="cashcut-success" class="users-success"></p>
            </div>

            <div class="cashcut-products-panel card">
                <div class="cut-products-title">Artículos vendidos en el período</div>
                <div id="cashcut-products-list"><p style="color:#6b7280;font-size:0.88rem;">Cargando...</p></div>
            </div>
            </div><!-- end cashcut-layout -->
        </div>
    `;

    //Assing every input to a variable for easy use
    const fromInput = document.getElementById("cashcut-from");
    const toInput = document.getElementById("cashcut-to");
    const salesInput = document.getElementById("cashcut-sales");
    const salesCountInput = document.getElementById("cashcut-sales-count");
    const returnsInput = document.getElementById("cashcut-returns");
    const returnsCountInput = document.getElementById("cashcut-returns-count");
    const expensesInput = document.getElementById("cashcut-expenses");
    const expensesCountInput = document.getElementById("cashcut-expenses-count");
    const cashInput = document.getElementById("cashcut-cash");
    const cardInput = document.getElementById("cashcut-card");
    const transferInput = document.getElementById("cashcut-transfer");
    const expectedInput = document.getElementById("cashcut-expected");
    const countedInput = document.getElementById("cashcut-counted");
    const differenceInput = document.getElementById("cashcut-difference");
    const commentInput = document.getElementById("cashcut-comment");

    const saveBtn = document.getElementById("btn-save-cashcut");
    const refreshBtn = document.getElementById("btn-refresh-cashcut");
    const clearBtn = document.getElementById("btn-clear-cashcut");

    const errorEl = document.getElementById("cashcut-error");
    const successEl = document.getElementById("cashcut-success");

    let previewData = null;

    //Money Formating functions
    function money(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function parseMoney(value) {
        return Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
    }

    //Refreshes the difference field everytime a new counted amount is inputed
    function recalcDifference() {
        const expected = parseMoney(expectedInput.value);
        const counted = parseMoney(countedInput.value);
        const difference = counted - expected;
        differenceInput.value = money(difference);
    }

    //Clear all the fields
    function clearForm(){
        countedInput.value = "";
        commentInput.value = "";
        differenceInput.value = "$0.00";
        errorEl.textContent = "";
        successEl.textContent = "";
    }

    //Fills all the fields with pending cashcut data
    async function loadPreview() {
        errorEl.textContent = "";
        successEl.textContent = "";

        try{
            previewData = await previewCashCut();

            fromInput.value = formatDateMX(previewData.from_ts);
            toInput.value = formatDateMX(previewData.to_ts);
            salesInput.value = money(previewData.total_sales);
            salesCountInput.value = previewData.sales_count ?? 0;
            returnsInput.value = money(previewData.total_returns);
            returnsCountInput.value = previewData.returns_count ?? 0;
            expensesInput.value = money(previewData.total_expenses);
            expensesCountInput.value = previewData.expenses_count ?? 0;
            cashInput.value = money(previewData.total_cash);
            cardInput.value = money(previewData.total_card);
            transferInput.value = money(previewData.total_transfer);
            expectedInput.value = money(previewData.cash_expected);
            countedInput.value = "";
            differenceInput.value = "$0.00";

            const productsList = document.getElementById("cashcut-products-list");
            const products = previewData.products_summary || [];
            if (!products.length) {
                productsList.innerHTML = `<p style="color:#6b7280;font-size:0.88rem;">Sin artículos vendidos en este período.</p>`;
            } else {
                productsList.innerHTML = `
                    <div class="cut-products-table">
                        <div class="cut-products-row cut-products-heading">
                            <div>Artículo</div><div>Cant.</div><div>Total</div>
                        </div>
                        ${products.map(p => `
                            <div class="cut-products-row">
                                <div>${p.description}</div>
                                <div>${p.quantity}</div>
                                <div>$${Number(p.total).toFixed(2)}</div>
                            </div>
                        `).join("")}
                    </div>`;
            }
        } catch (error) {
            errorEl.textContent = error.message || "Error al cargar preview del corte";
        }
    }

    //Executes the submit of the cashcut
    async function handleCloseCashcut() {
        errorEl.textContent = "";
        successEl.textContent = "";

        const cash_counted = Number(countedInput.value || 0);
        const comment = commentInput.value.trim();

        if (cash_counted <= 0){
            errorEl.textContent = "Debes capturar el efectivo contado";
            return;
        }

        try{
            const payload = {
                cash_counted,
                comment,
            };
            
            const result = await closeCashCut(payload);

            const printPayload = {
                ...result,
                ticket_type: "cashcut",
                from_ts: formatDateMX(result.from_ts),
                to_ts: formatDateMX(result.to_ts),
                sales_detail: (result.sales_detail || []).map((sale) => ({
                    ...sale,
                    created_at: formatDateMX(sale.created_at),
                })),
            };

            try {
                await printTicket(printPayload);
            } catch (printError) {
                console.error("Error al imprimir corte de caja:", printError);
                errorEl.textContent = `Corte registrado, pero no se pudo imprimir: ${printError.message || printError}`;
            }

            successEl.textContent = "Corte de caja registrado correctamente";
            await loadPreview();
            clearForm();
        } catch(error){
            errorEl.textContent = error.message || "Error al registrar el corte de caja";
        }
    }

    //Button listeners
    countedInput.addEventListener("input", recalcDifference);
    saveBtn.addEventListener("click", handleCloseCashcut);
    refreshBtn.addEventListener("click", loadPreview);
    clearBtn.addEventListener("click", clearForm);

    await loadPreview();
}