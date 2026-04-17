export function validateSettings(settings) {
    return Object.values(settings).every((value) => Number.isInteger(value) && value > 0);
}