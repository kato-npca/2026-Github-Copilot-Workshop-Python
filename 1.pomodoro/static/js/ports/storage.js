const STORAGE_KEY = "pomodoro-state";

export function saveState(state) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn("Failed to save pomodoro state to localStorage.", error);
    }
}

export function loadState() {
    try {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
        console.warn("Failed to load pomodoro state from localStorage.", error);
        return null;
    }
}