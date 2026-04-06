import { createUser, getUser } from "../api/users";

export function renderUsers(container) {
    container.innerHTML = `
        <div class = "page">
            <h2>Usuarios</h2>

            <div class = "users-card card">
                <div class = "users-form">
                    <div>
                        <label for = "user-name">Nombre</label>
                        <input type = "text" id = "user-name" placeholder = "Nombre completo"/>
                    </div>
                    <div>
                        <label for = "user-username">Usuario</label>
                        <input type = "text" id = "user-username" placeholder = "Usuario"/>
                    </div>
                    <div>
                        <label for = "user-password">Contraseña</label>
                        <input type = "password" id = "user-password" placeholder = "Contraseña"/>
                    </div>
                    <div>
                        <label for = "user-role">Rol</label>
                        <select id = "user-role">
                            <option value = "" disabled selected>Selecciona un rol</option>
                            <option value = "2">Administrador</option>
                            <option value = "3">Cajero</option>
                        </select>
                    </div>

                    <div class = "users-actions">
                        <button id = "btn-create-user">Aceptar</button>
                        <button id = "btn-clear-user" class = "secondary">Limpiar</button>
                    </div>

                    <p id = "users-error" class = "login-error"></p>
                    <p id = "users-success" class = "users-success"></p>

                </div>
            </div>
        </div>
    `;

    //Assing every input to a variable for easy use
    const nameInput = document.getElementById("user-name");
    const usernameInput = document.getElementById("user-username");
    const passwordInput = document.getElementById("user-password");
    const roleInput = document.getElementById("user-role");

    const createBtn = document.getElementById("btn-create-user");
    const clearBtn = document.getElementById("btn-clear-user");

    const errorEl = document.getElementById("users-error");
    const successEl = document.getElementById("users-success");

    //Clear all the fields
    function clearForm(){
        nameInput.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
        roleInput.value = "1";
        errorEl.textContent = "";
        successEl.textContent = "";
    }

    //Executes the submit of the user creation
    async function handleCreateUser() {
        errorEl.textContent = "";
        successEl.textContent = "";
        
        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const role = Number(roleInput.value);

        if(!name || !username || !password || !role) {
            errorEl.textContent = "Llena todos los campos";
            return;
        }

        try {
            const payload = {
                name,
                username,
                password,
                role
            };

            const user = await createUser(payload);

            successEl.textContent = `Usuario ${user.username} creado correctamente`;
            clearForm();
        } catch (error) {
            errorEl.textContent = error.message || "Error al crear el usuario";
        }
    }

    //Button listeners
    createBtn.addEventListener("click", handleCreateUser);
    clearBtn.addEventListener("click", clearForm);
}