/**
 * Returns how many new trees are planted when moving from visitCount to visitCount+1.
 * A tree is planted every `visitsPerTree` visits.
 */
export function calculateNewTrees(visitCount: number, visitsPerTree: number): number {
    return Math.floor((visitCount + 1) / visitsPerTree) - Math.floor(visitCount / visitsPerTree);
}
