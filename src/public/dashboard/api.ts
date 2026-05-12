import type { VisitPerHour, Customer } from "./types.js";

export async function fetchVisitsPerHour(): Promise<VisitPerHour[]> {
    const res = await fetch("/api/visits/per-hour");
    return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
    const res = await fetch("/api/customers");
    return res.json();
}

export async function fetchConfig(): Promise<{ visitsPerTree: number }> {
    const res = await fetch("/api/config");
    return res.json();
}
