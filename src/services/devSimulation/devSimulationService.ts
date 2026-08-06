import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dev_simulation_bank_fetch_failure';

/**
 * Dev simulation service for controlling test scenarios
 * Used by dev-panel to simulate different flows
 */
export const devSimulationService = {
  /**
   * Check if bank fetch failure simulation is enabled
   */
  async isBankFetchFailureEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Enable/disable bank fetch failure simulation
   */
  async setBankFetchFailure(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to update bank fetch failure simulation:', error);
    }
  },

  /**
   * Clear all simulation flags
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear simulation flags:', error);
    }
  },
};
