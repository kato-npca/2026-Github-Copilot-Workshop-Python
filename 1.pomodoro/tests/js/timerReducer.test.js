import test from "node:test";
import assert from "node:assert/strict";

import { createInitialState } from "../../static/js/domain/timerState.js";
import {
    pauseTimer,
    restoreTimerState,
    startTimer,
    tickTimer,
    transitionToMode,
} from "../../static/js/domain/timerReducer.js";

test("startTimer sets a target timestamp", () => {
    const state = createInitialState();
    const nextState = startTimer(state, 10_000);

    assert.equal(nextState.isRunning, true);
    assert.equal(nextState.targetEpochMs, 10_000 + 1_500_000);
});

test("transitionToMode resets remaining time for the selected mode", () => {
    const state = createInitialState();
    const nextState = transitionToMode(state, "shortBreak");

    assert.equal(nextState.mode, "shortBreak");
    assert.equal(nextState.remainingSeconds, 300);
});

test("pauseTimer recalculates remaining time", () => {
    const runningState = startTimer(createInitialState(), 0);
    const nextState = pauseTimer(runningState, 30_000);

    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.remainingSeconds, 1470);
});

test("tickTimer updates the remaining time while running", () => {
    const runningState = startTimer(createInitialState(), 0);
    const nextState = tickTimer(runningState, 1_000);

    assert.equal(nextState.remainingSeconds, 1499);
    assert.equal(nextState.isRunning, true);
});

test("tickTimer stops the timer when it reaches zero", () => {
    const runningState = startTimer({
        ...createInitialState(),
        remainingSeconds: 1,
    }, 0);
    const nextState = tickTimer(runningState, 1_500);

    assert.equal(nextState.remainingSeconds, 0);
    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.targetEpochMs, null);
});

test("restoreTimerState recalculates remaining time for a running snapshot", () => {
    const restoredState = restoreTimerState({
        mode: "focus",
        isRunning: true,
        completedFocusCount: 2,
        remainingSeconds: 1500,
        targetEpochMs: 90_000,
        settings: {
            focusSeconds: 1500,
            shortBreakSeconds: 300,
            longBreakSeconds: 900,
            longBreakInterval: 4,
        },
    }, 30_000);

    assert.equal(restoredState.remainingSeconds, 60);
    assert.equal(restoredState.isRunning, true);
    assert.equal(restoredState.completedFocusCount, 2);
});

test("restoreTimerState stops an expired running snapshot", () => {
    const restoredState = restoreTimerState({
        mode: "focus",
        isRunning: true,
        completedFocusCount: 0,
        remainingSeconds: 1500,
        targetEpochMs: 1_000,
        settings: {
            focusSeconds: 1500,
            shortBreakSeconds: 300,
            longBreakSeconds: 900,
            longBreakInterval: 4,
        },
    }, 5_000);

    assert.equal(restoredState.remainingSeconds, 0);
    assert.equal(restoredState.isRunning, false);
});