import { pauseTimer, resetTimer, startTimer, transitionToMode } from "../domain/timerReducer.js";

export function bindHandlers({ getState, setState, clock }) {
    document.getElementById("start-button").addEventListener("click", () => {
        const nextState = startTimer(getState(), clock());
        setState(nextState);
    });

    document.getElementById("pause-button").addEventListener("click", () => {
        const nextState = pauseTimer(getState(), clock());
        setState(nextState);
    });

    document.getElementById("reset-button").addEventListener("click", () => {
        const nextState = resetTimer(getState());
        setState(nextState);
    });

    document.querySelectorAll("[data-mode]").forEach((button) => {
        button.addEventListener("click", () => {
            const nextState = transitionToMode(getState(), button.dataset.mode);
            setState(nextState);
        });
    });
}