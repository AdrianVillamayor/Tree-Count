const baseUrl = process.env.BASE_URL || "http://localhost:3030";
const timeoutMs = 10_000;
const intervalMs = 250;
const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
    try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
            process.exit(0);
        }
    } catch {
        // Server is not accepting connections yet.
        console.log(`Waiting for server at ${baseUrl}...`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(`Server did not become ready at ${baseUrl} within ${timeoutMs}ms`);
process.exit(1);
