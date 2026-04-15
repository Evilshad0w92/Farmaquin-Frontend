import {
    searchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
} from "../api/expenses";
import { formatDateMX } from "../utils/date";

export async function renderExpenses(container) {
    let expenses = [];
    let editingExpenseId = null;

    container.innerHTML = `
        <div class="page">
            <h2>Gastos</h2>

            <div class="card">
                <div class="expenses-toolbar">
                    <div class="expenses-search-block">
                        <label for="expense-search">Buscar</label>
                        <input type="text" id="expense-search" placeholder="Descripción o tipo" />
                    </div>

                    <button id="btn-new-expense">Nuevo Gasto</button>
                </div>
            </div>

            <div class="card">
                <div class="expenses-table-wrapper">
                    <table class="expenses-table">
                        <thead>
                            <tr>
                                <th>Monto</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="expenses-table-body">
                            <tr>
                                <td colspan="5">Sin resultados</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p id="expenses-error" class="login-error"></p>
                <p id="expenses-success" class="users-success"></p>
            </div>

            <div id="expense-modal" class="expense-modal hidden">
                <div class="expense-modal-content card">
                    <h3 id="expense-modal-title">Nuevo Gasto</h3>

                    <div class="expense-form">
                        <div>
                            <label for="expense-amount">Monto</label>
                            <input type="number" id="expense-amount" min="0" step="0.01" placeholder="0.00" />
                        </div>

                        <div>
                            <label for="expense-type">Tipo</label>
                            <select id="expense-type">
                                <option value="">Selecciona</option>
                                <option value="Retiro de Efectivo">Retiro de Efectivo</option>
                                <option value="Renta">Renta</option>
                                <option value="Salarios">Salarios</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        <div class="expense-description-block">
                            <label for="expense-description">Descripción</label>
                            <input type="text" id="expense-description" placeholder="Describe el gasto" />
                        </div>
                    </div>

                    <div class="expenses-actions">
                        <button id="btn-save-expense">Guardar</button>
                        <button id="btn-cancel-expense" class="secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById("expense-search");
    const tableBody = document.getElementById("expenses-table-body");
    const errorEl = document.getElementById("expenses-error");
    const successEl = document.getElementById("expenses-success");

    const modal = document.getElementById("expense-modal");
    const modalTitle = document.getElementById("expense-modal-title");
    const btnNewExpense = document.getElementById("btn-new-expense");
    const btnSaveExpense = document.getElementById("btn-save-expense");
    const btnCancelExpense = document.getElementById("btn-cancel-expense");

    const amountInput = document.getElementById("expense-amount");
    const typeInput = document.getElementById("expense-type");
    const descriptionInput = document.getElementById("expense-description");

    function money(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function clearMessages() {
        errorEl.textContent = "";
        successEl.textContent = "";
    }

    function resetForm() {
        editingExpenseId = null;
        amountInput.value = "";
        typeInput.value = "";
        descriptionInput.value = "";
        modalTitle.textContent = "Nuevo Gasto";
    }

    function openModalForCreate() {
        resetForm();
        modal.classList.remove("hidden");
    }

    function openModalForEdit(expense) {
        editingExpenseId = expense.id;
        amountInput.value = Number(expense.amount || 0).toFixed(2);
        typeInput.value = expense.expense_type || "";
        descriptionInput.value = expense.description || "";
        modalTitle.textContent = "Editar Gasto";
        modal.classList.remove("hidden");
    }

    function closeModal() {
        modal.classList.add("hidden");
        resetForm();
    }

    function renderTable() {
        if (!expenses.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">Sin resultados</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = expenses.map((expense) => `
            <tr>
                <td>${money(expense.amount)}</td>
                <td>${expense.description}</td>
                <td>${expense.expense_type}</td>
                <td>${formatDateMX(expense.created_at)}</td>
                <td>
                    <div class="expense-row-actions">
                        <button class="expense-edit-btn" data-id="${expense.id}">Editar</button>
                        <button class="expense-delete-btn secondary" data-id="${expense.id}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".expense-edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const expenseId = Number(btn.dataset.id);
                const expense = expenses.find((item) => item.id === expenseId);
                if (expense) openModalForEdit(expense);
            });
        });

        document.querySelectorAll(".expense-delete-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const expenseId = Number(btn.dataset.id);
                await handleDelete(expenseId);
            });
        });
    }

    async function loadExpenses() {
        clearMessages();

        try {
            expenses = await searchExpenses(searchInput.value.trim());
            renderTable();
        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">Sin resultados</td>
                </tr>
            `;
            errorEl.textContent = error.message || "Error al cargar gastos";
        }
    }

    async function handleSave() {
        clearMessages();

        const amount = Number(amountInput.value || 0);
        const expense_type = typeInput.value.trim();
        const description = descriptionInput.value.trim();

        if (amount <= 0) {
            errorEl.textContent = "El monto debe ser mayor a cero";
            return;
        }

        if (!expense_type) {
            errorEl.textContent = "Selecciona un tipo de gasto";
            return;
        }

        if (!description) {
            errorEl.textContent = "La descripción es obligatoria";
            return;
        }

        try {
            if (editingExpenseId) {
                await updateExpense({
                    id: editingExpenseId,
                    amount,
                    expense_type,
                    description,
                });
                successEl.textContent = "Gasto actualizado correctamente";
            } else {
                await createExpense({
                    amount,
                    expense_type,
                    description,
                });
                successEl.textContent = "Gasto registrado correctamente";
            }

            closeModal();
            await loadExpenses();
        } catch (error) {
            errorEl.textContent = error.message || "Error al guardar gasto";
        }
    }

    async function handleDelete(expenseId) {
        clearMessages();

        const confirmed = window.confirm("¿Deseas eliminar este gasto?");
        if (!confirmed) return;

        try {
            await deleteExpense(expenseId);
            successEl.textContent = "Gasto eliminado correctamente";
            await loadExpenses();
        } catch (error) {
            errorEl.textContent = error.message || "Error al eliminar gasto";
        }
    }

    searchInput.addEventListener("input", loadExpenses);
    btnNewExpense.addEventListener("click", openModalForCreate);
    btnSaveExpense.addEventListener("click", handleSave);
    btnCancelExpense.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    await loadExpenses();
}