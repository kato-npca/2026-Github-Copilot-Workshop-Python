import test from "node:test";
import assert from "node:assert/strict";

import { formatSeconds, getRemainingSeconds } from "../../static/js/domain/timeMath.js";

test("formatSeconds formats seconds as mm:ss", () => {
    assert.equal(formatSeconds(1500), "25:00");
});

test("getRemainingSeconds returns zero when the target time has passed", () => {
    assert.equal(getRemainingSeconds(1_000, 3_000), 0);
});