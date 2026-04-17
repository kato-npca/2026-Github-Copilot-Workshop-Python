import { createInitialState } from "./domain/timerState.js";
import { restoreTimerState, tickTimer } from "./domain/timerReducer.js";
import { systemClock } from "./ports/clock.js";
import { loadState, saveState } from "./ports/storage.js";
import { bindHandlers } from "./ui/handlers.js";
import { renderTimer } from "./ui/render.js";

let state = restoreTimerState(loadState() ?? createInitialState(), systemClock());
let tickerId = null;

function getState() {
    return state;
}

function setState(nextState) {
    state = nextState;
    renderTimer(state);
    saveState(state);
    syncTicker();
}

bindHandlers({
    getState,
    setState,
    clock: systemClock,
});

setState(state);

function syncTicker() {
    if (state.isRunning && tickerId === null) {
        tickerId = window.setInterval(() => {
            const nextState = tickTimer(state, systemClock());

            if (nextState !== state) {
                setState(nextState);
            }
        }, 250);
        return;
    }

    if (!state.isRunning && tickerId !== null) {
        window.clearInterval(tickerId);
        tickerId = null;
    }
}