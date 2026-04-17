export function getRemainingSeconds(targetEpochMs, nowEpochMs) {
    if (targetEpochMs === null) {
        return 0;
    }

    return Math.max(0, Math.ceil((targetEpochMs - nowEpochMs) / 1000));
}

export function formatSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}