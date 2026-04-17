import { getRemainingSeconds } from "./timeMath.js";
import { createInitialState } from "./timerState.js";

function getModeDuration(mode, settings) {
    if (mode === "focus") {
        return settings.focusSeconds;
    }

    if (mode === "shortBreak") {
        return settings.shortBreakSeconds;
    }

    return settings.longBreakSeconds;
}

export function transitionToMode(state, mode) {
    const nextMode = isSupportedMode(mode) ? mode : "focus";

    return {
        ...state,
        mode: nextMode,
        isRunning: false,
        remainingSeconds: getModeDuration(nextMode, state.settings),
        targetEpochMs: null,
    };
}

export function startTimer(state, nowEpochMs) {
    if (state.isRunning || state.remainingSeconds <= 0) {
        return state;
    }

    return {
        ...state,
        isRunning: true,
        targetEpochMs: nowEpochMs + state.remainingSeconds * 1000,
    };
}

export function pauseTimer(state, nowEpochMs) {
    if (!state.isRunning) {
        return state;
    }

    return {
        ...state,
        isRunning: false,
        remainingSeconds: getRemainingSeconds(state.targetEpochMs, nowEpochMs),
        targetEpochMs: null,
    };
}

export function resetTimer(state) {
    return transitionToMode(state, state.mode);
}

export function tickTimer(state, nowEpochMs) {
    if (!state.isRunning || state.targetEpochMs === null) {
        return state;
    }

    const remainingSeconds = getRemainingSeconds(state.targetEpochMs, nowEpochMs);

    if (remainingSeconds === state.remainingSeconds && remainingSeconds > 0) {
        return state;
    }

    return {
        ...state,
        isRunning: remainingSeconds > 0,
        remainingSeconds,
        targetEpochMs: remainingSeconds > 0 ? state.targetEpochMs : null,
    };
}

export function restoreTimerState(snapshot, nowEpochMs) {
    if (!snapshot) {
        return createInitialState();
    }

    const baseState = createInitialState(snapshot.settings);
    const restoredMode = isSupportedMode(snapshot.mode) ? snapshot.mode : baseState.mode;
    const restoredState = {
        ...baseState,
        mode: restoredMode,
        completedFocusCount: normalizeCompletedFocusCount(snapshot.completedFocusCount),
    };

    if (snapshot.isRunning && typeof snapshot.targetEpochMs === "number") {
        const runningState = {
            ...restoredState,
            isRunning: true,
            targetEpochMs: snapshot.targetEpochMs,
            remainingSeconds: getModeDuration(restoredMode, restoredState.settings),
        };

        return tickTimer(runningState, nowEpochMs);
    }

    if (Number.isInteger(snapshot.remainingSeconds) && snapshot.remainingSeconds >= 0) {
        return {
            ...restoredState,
            remainingSeconds: snapshot.remainingSeconds,
        };
    }

    return transitionToMode(restoredState, restoredMode);
}

function isSupportedMode(mode) {
    return mode === "focus" || mode === "shortBreak" || mode === "longBreak";
}

function normalizeCompletedFocusCount(value) {
    return Number.isInteger(value) && value >= 0 ? value : 0;
}