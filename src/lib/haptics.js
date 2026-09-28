// Light haptic feedback using the Vibration API.
// Best-effort: silently no-op on devices/browsers without support (desktop, iOS Safari).

export const HAPTICS = {
  light: 10,
  medium: 18,
  success: [10, 25, 10],
  warning: 18,
  error: [25, 35, 25],
};

export function haptic(pattern = HAPTICS.light) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch (_) {
    // haptics are best-effort — never block the action
  }
}