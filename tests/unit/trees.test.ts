import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateNewTrees } from "../../src/domain/trees.js";

describe("calculateNewTrees", () => {
    it("returns 0 when not crossing threshold", () => {
        assert.equal(calculateNewTrees(0, 5), 0); // 1st visit
        assert.equal(calculateNewTrees(1, 5), 0); // 2nd visit
        assert.equal(calculateNewTrees(3, 5), 0); // 4th visit
    });

    it("returns 1 when crossing threshold", () => {
        assert.equal(calculateNewTrees(4, 5), 1);  // 5th visit
        assert.equal(calculateNewTrees(9, 5), 1);  // 10th visit
        assert.equal(calculateNewTrees(14, 5), 1); // 15th visit
    });

    it("returns 1 when visitsPerTree is 1", () => {
        assert.equal(calculateNewTrees(0, 1), 1);
        assert.equal(calculateNewTrees(1, 1), 1);
        assert.equal(calculateNewTrees(99, 1), 1);
    });

    it("handles visitsPerTree equal to 2", () => {
        assert.equal(calculateNewTrees(0, 2), 0); // 1st visit
        assert.equal(calculateNewTrees(1, 2), 1); // 2nd visit
        assert.equal(calculateNewTrees(2, 2), 0); // 3rd visit
        assert.equal(calculateNewTrees(3, 2), 1); // 4th visit
    });

    it("handles large visit counts", () => {
        assert.equal(calculateNewTrees(999, 5), 1);  // 1000th visit
        assert.equal(calculateNewTrees(1000, 5), 0);  // 1001st visit
    });
});
