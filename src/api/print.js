//this file contains the function to send the ticket data to the local print server
export async function printTicket(ticketData) {
    const response = await fetch("http://127.0.0.1:9100/print", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
    });

    const contentType = response.headers.get("Content-Type") || "";

    let data;
    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        throw new Error(
            typeof data === "string" ? data : data?.message || "Error desconocido al imprimir el ticket"
        );
    }   

    return data;
}