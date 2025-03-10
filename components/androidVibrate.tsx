import { Platform } from "react-native";
import { Vibration } from "react-native";

// Single vibration (e.g., 200 milliseconds)
export const triggerSimpleAndroidVibration = (): void => {
    if (Platform.OS === 'android') {
        Vibration.vibrate(200); // Type-safe: number
    }
    // Vibration.vibrate(200); // Type-safe: number
};

// Multiple vibrations (e.g., 200, 400, and 600 milliseconds)
export const triggerPatternVibration = (): void => {
    Vibration.vibrate([200, 400, 600]); // Type-safe: number[]
};

// Cancel vibration
export const cancelVibration = (): void => {
    Vibration.cancel();
};

