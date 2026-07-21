import { apiFetch } from "./client";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const getNotesBoard = () => apiFetch("/notes/board");
export const getMyNotes = () => apiFetch("/notes/mine");
export const updateMyNote = (content) => apiFetch("/notes/mine", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ content }) });
export const addTask = (description) => apiFetch("/notes/tasks", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ description }) });
export const updateTask = (id, description, done) => apiFetch(`/notes/tasks/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ description, done }) });
export const deleteTask = (id) => apiFetch(`/notes/tasks/${id}`, { method: "DELETE" });
