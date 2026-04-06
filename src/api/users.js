import { apiFetch } from "./client";

export async function createUser(payload) {
    return await apiFetch("/users/",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
    })
}

export async function getUser(payload) {
    return await apiFetch("/users/",{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
    })
}

export async function changeMyPassword(payload) {
    return await apiFetch("/users/me/password", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}
