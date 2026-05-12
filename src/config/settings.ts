export const env = {
    port: Number(process.env.PORT) || 3030,
    databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/treecount",
    visitsPerTree: Number(process.env.VISITS_PER_TREE) || 5,
};
