import { searchExpenses, updateExpense, deleteExpense } from "../api/expenses";
import { formatDateMX } from "../utils/date";

export async function renderExpenses(container) {
    container.innerHTML = `
        <div class="page">
            <h2>Gastos</h2>

            <div class="card">
                <div class="form-row">
                    <label>Buscar</label>
                    <input type="text" id="expense-search" placeholder="Descripción o tipo" />
                </div>

                <div id="expenses-list" class="expenses-list">
                    <p>Sin resultados</p>
                </div>

                <p id="expenses-error" class="login-error"></p>
                <p id="expenses-success" class="users-success"></p>
            </div>
        </div>
    `;

    const searchInput = document.getElementById("expense-search");
    const listEl = document.getElementById("expenses-list");
    const errorEl = document.getElementById("expenses-error");
    const successEl = document.getElementById("expenses-success");

    let expenses = [];

    function money(v){
        return `$${Number(v || 0).toFixed(2)}`;
    }

    function renderList(){
        if (!expenses.length){
            listEl.innerHTML = `<p>Sin resultados</p>`;
            return;
        }

        listEl.innerHTML = expenses.map((e, i) => `
            <div class="expense-row" data-index="${i}">
                <div>
                    <strong>${money(e.amount)}</strong><br/>
                    <small>${e.description}</small><br/>
                    <small>${e.expense_type}</small><br/>
                    <small>${formatDateMX(e.created_at)}</small>
                </div>

                <div class="expense-actions">
                    <button class="edit-btn" data-index="${i}">Editar</button>
                    <button class="delete-btn secondary" data-index="${i}">Eliminar</button>
                </div>
            </div>
        `).join("");

        // Edit
        document.querySelectorAll(".edit-btn").forEach(btn=>{
            btn.addEventListener("click", ()=>{
                const index = Number(btn.dataset.index);
                openEditModal(expenses[index]);
            });
        });

        // Delete
        document.querySelectorAll(".delete-btn").forEach(btn=>{
            btn.addEventListener("click", async ()=>{
                const index = Number(btn.dataset.index);
                await handleDelete(expenses[index].id);
            });
        });
    }

    async function loadExpenses(){
        errorEl.textContent = "";
        successEl.textContent = "";

        try{
            expenses = await searchExpenses(searchInput.value.trim());
            renderList();
        }catch(err){
            errorEl.textContent = err.message || "Error al cargar gastos";
        }
    }

    async function handleDelete(id){
        if (!confirm("¿Eliminar este gasto?")) return;

        try{
            await deleteExpense(id);
            successEl.textContent = "Gasto eliminado";
            await loadExpenses();
        }catch(err){
            errorEl.textContent = err.message;
        }
    }

    function openEditModal(expense){
        const newAmount = prompt("Monto:", expense.amount);
        if (newAmount === null) return;

        const newDesc = prompt("Descripción:", expense.description);
        if (newDesc === null) return;

        const newType = prompt("Tipo:", expense.expense_type);
        if (newType === null) return;

        handleUpdate({
            id: expense.id,
            amount: Number(newAmount),
            description: newDesc,
            expense_type: newType,
        });
    }

    async function handleUpdate(data){
        errorEl.textContent = "";
        successEl.textContent = "";

        try{
            await updateExpense(data);
            successEl.textContent = "Gasto actualizado";
            await loadExpenses();
        }catch(err){
            errorEl.textContent = err.message;
        }
    }

    // listeners
    searchInput.addEventListener("input", loadExpenses);

    await loadExpenses();
}