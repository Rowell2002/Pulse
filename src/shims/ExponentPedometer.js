/**
 * ExponentPedometer shim for Expo Go / environments without native module support.
 * When the real native module is unavailable, expo-sensors Pedometer.isAvailableAsync()
 * will resolve to false and the app gracefully shows mock step data instead of crashing.
 */
export default {
  isAvailableAsync: async () => false,
  getStepCountAsync: async () => ({ steps: 0 }),
  startUpdates: () => {},
  stopUpdates: () => {},
};
