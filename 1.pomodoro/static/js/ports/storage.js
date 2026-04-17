const STORAGE_KEY = "pomodoro-state";

export function saveState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
}