export const DEFAULT_SETTINGS = {
    focusSeconds: 25 * 60,
    shortBreakSeconds: 5 * 60,
    longBreakSeconds: 15 * 60,
    longBreakInterval: 4,
};

export function createInitialState(settings = DEFAULT_SETTINGS) {
    const normalizedSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
    };

    return {
        mode: "focus",
        isRunning: false,
        completedFocusCount: 0,
        remainingSeconds: normalizedSettings.focusSeconds,
        targetEpochMs: null,
        settings: normalizedSettings,
    };
}