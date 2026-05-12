import type { Customer, VisitPerHour } from "./dashboard/types.js";
import { fetchVisitsPerHour, fetchCustomers, fetchConfig } from "./dashboard/api.js";
import { renderChart } from "./dashboard/chart.js";

function updateStats(customers: Customer[], visits: VisitPerHour[]) {
    const totalVisits = visits.reduce((sum, v) => sum + v.count, 0);
    const totalTrees = customers.reduce((sum, c) => sum + c.treesPlanted, 0);

    document.getElementById("total-visits")!.textContent = String(totalVisits);
    document.getElementById("total-customers")!.textContent = String(customers.length);
    document.getElementById("total-trees")!.textContent = String(totalTrees);
}

function renderCustomersTable(customers: Customer[]) {
    const tbody = document.getElementById("customers-table")!;
    const noMsg = document.getElementById("no-customers")!;

    if (customers.length === 0) {
        tbody.replaceChildren();
        noMsg.classList.remove("hidden");
        return;
    }

    noMsg.classList.add("hidden");
    const rows = customers
        .sort((a, b) => b.visitCount - a.visitCount)
        .map((c) => {
            const lastVisit = new Date(c.lastConnectionAt).toLocaleString(undefined, {
                month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
            });

            const row = document.createElement("tr");
            row.className = "border-b border-gray-800/50";

            const idCell = document.createElement("td");
            idCell.className = "py-2 pr-4 font-mono";
            idCell.textContent = c.id;

            const visitsCell = document.createElement("td");
            visitsCell.className = "py-2 pr-4 text-right";
            visitsCell.textContent = String(c.visitCount);

            const treesCell = document.createElement("td");
            treesCell.className = "py-2 pr-4 text-right";
            const treesBadge = document.createElement("span");
            treesBadge.className = c.treesPlanted > 0 ? "text-green-400" : "text-gray-600";
            treesBadge.textContent = String(c.treesPlanted);
            treesCell.append(treesBadge);

            const lastVisitCell = document.createElement("td");
            lastVisitCell.className = "py-2 text-right text-gray-400";
            lastVisitCell.textContent = lastVisit;

            row.append(idCell, visitsCell, treesCell, lastVisitCell);
            return row;
        });

    tbody.replaceChildren(...rows);
}

async function refresh() {
    const [visits, customers, config] = await Promise.all([
        fetchVisitsPerHour(),
        fetchCustomers(),
        fetchConfig(),
    ]);
    updateStats(customers, visits);
    renderChart(visits);
    renderCustomersTable(customers);
    document.getElementById("visits-per-tree")!.textContent = String(config.visitsPerTree);
}

refresh();
