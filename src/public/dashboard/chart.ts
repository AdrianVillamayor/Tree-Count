import type { VisitPerHour } from "./types.js";

let chart: any = null;

function toLocalHour(utcHour: string): string {
    const date = new Date(utcHour.replace(" ", "T") + ":00Z");
    return date.toLocaleString(undefined, {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
}

export function renderChart(data: VisitPerHour[]) {
    const ctx = (document.getElementById("chart") as HTMLCanvasElement).getContext("2d")!;
    const sorted = [...data].sort((a, b) => a.hour.localeCompare(b.hour));

    if (chart) {
        chart.data.labels = sorted.map((d) => toLocalHour(d.hour));
        chart.data.datasets[0].data = sorted.map((d) => d.count);
        chart.update();
        return;
    }

    chart = new (window as any).Chart(ctx, {
        type: "bar",
        data: {
            labels: sorted.map((d) => toLocalHour(d.hour)),
            datasets: [
                {
                    label: "Visits",
                    data: sorted.map((d) => d.count),
                    backgroundColor: "#22c55e",
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    ticks: { color: "#9ca3af" },
                    grid: { display: false },
                },
                y: {
                    ticks: { color: "#9ca3af", stepSize: 1 },
                    grid: { color: "#1f2937" },
                },
            },
        },
    });
}
