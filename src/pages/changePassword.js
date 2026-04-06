import { changeMyPassword } from "../api/users";

export function renderChangePassword(container) {
    container.innerHTML = `
        <div class="page">
            <h2>Cambiar Contraseña</h2>

            <div class="users-card card">
                <div class="users-form single-column">
                    <div>
                        <label for="current-password">Contraseña actual</label>
                        <input type="password" id="current-password" />
                    </div>

                    <div>
                        <label for="new-password">Nueva contraseña</label>
                        <input type="password" id="new-password" />
                    </div>

                    <div>
                        <label for="confirm-password">Confirmar nueva contraseña</label>
                        <input type="password" id="confirm-password" />
                    </div>
                </div>

                <div class="users-actions">
                    <button id="btn-change-password">Guardar</button>
                    <button id="btn-clear-password" class="secondary">Limpiar</button>
                </div>

                <p id="change-password-error" class="login-error"></p>
                <p id="change-password-success" class="users-success"></p>
            </div>
        </div>
    `;

    const currentPasswordEl = document.getElementById("current-password");
    const newPasswordEl = document.getElementById("new-password");
    const confirmPasswordEl = document.getElementById("confirm-password");

    const saveBtn = document.getElementById("btn-change-password");
    const clearBtn = document.getElementById("btn-clear-password");

    const errorEl = document.getElementById("change-password-error");
    const successEl = document.getElementById("change-password-success");

    function clearForm() {
        currentPasswordEl.value = "";
        newPasswordEl.value = "";
        confirmPasswordEl.value = "";
        errorEl.textContent = "";
        successEl.textContent = "";
    }

    async function handleChangePassword() {
        errorEl.textContent = "";
        successEl.textContent = "";

        const current_password = currentPasswordEl.value.trim();
        const new_password = newPasswordEl.value.trim();
        const confirm_password = confirmPasswordEl.value.trim();

        if (!current_password || !new_password || !confirm_password) {
            errorEl.textContent = "Completa todos los campos";
            return;
        }

        if (new_password !== confirm_password) {
            errorEl.textContent = "La confirmación no coincide con la nueva contraseña";
            return;
        }

        try {
            await changeMyPassword({
                current_password,
                new_password,
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert("Contraseña actualizada correctamente. Debes iniciar sesión nuevamente.");
            window.location.reload();
        } catch (error) {
            errorEl.textContent = error.message || "Error al cambiar la contraseña";
        }
    }

    saveBtn.addEventListener("click", handleChangePassword);
    clearBtn.addEventListener("click", clearForm);
}