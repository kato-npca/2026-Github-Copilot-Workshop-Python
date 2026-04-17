import { formatSeconds } from "../domain/timeMath.js";

const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // r=90 in the SVG

export function renderTimer(state) {
    document.getElementById("mode-label").textContent = getModeLabel(state.mode);
    document.getElementById("mode-description").textContent = getModeDescription(state.mode);
    document.getElementById("timer-display").textContent = formatSeconds(state.remainingSeconds);
    document.getElementById("cycle-count").textContent = String(state.completedFocusCount);
    document.getElementById("focus-setting").textContent = formatMinutes(state.settings.focusSeconds);
    document.getElementById("short-break-setting").textContent = formatMinutes(state.settings.shortBreakSeconds);
    document.getElementById("long-break-setting").textContent = formatMinutes(state.settings.longBreakSeconds);
    document.getElementById("long-break-interval-setting").textContent = `${state.settings.longBreakInterval} 回`;

    // Status badge
    const badge = document.getElementById("session-status");
    const { label, status } = getSessionStatus(state);
    badge.textContent = label;
    badge.dataset.status = status;

    // Progress ring
    const totalSeconds = getModeTotalSeconds(state);
    const progress = totalSeconds > 0 ? state.remainingSeconds / totalSeconds : 0;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    document.getElementById("timer-ring-progress").setAttribute("stroke-dashoffset", String(offset));

    // Mode tabs
    document.querySelectorAll("[data-mode]").forEach((button) => {
        const isActive = button.dataset.mode === state.mode;
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function getModeLabel(mode) {
    if (mode === "focus") {
        return "Focus";
    }

    if (mode === "shortBreak") {
        return "Short Break";
    }

    return "Long Break";
}

function getModeDescription(mode) {
    if (mode === "focus") {
        return "集中セッションを始める準備ができています。";
    }

    if (mode === "shortBreak") {
        return "短い休憩で頭を切り替えるモードです。";
    }

    return "まとまった休憩を取る長休憩モードです。";
}

function formatMinutes(totalSeconds) {
    return `${Math.floor(totalSeconds / 60)} 分`;
}

function getSessionStatus(state) {
    if (state.isRunning) {
        return { label: "実行中", status: "running" };
    }

    if (state.remainingSeconds === 0) {
        return { label: "完了", status: "done" };
    }

    return { label: "停止中", status: "stopped" };
}

function getModeTotalSeconds(state) {
    if (state.mode === "focus") {
        return state.settings.focusSeconds;
    }

    if (state.mode === "shortBreak") {
        return state.settings.shortBreakSeconds;
    }

    return state.settings.longBreakSeconds;
}