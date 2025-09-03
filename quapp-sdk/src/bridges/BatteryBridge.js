
import BridgeWrapper from './BridgeWrapper.js';

class BatteryBridge extends BridgeWrapper {
    constructor() {
      super('Battery');
    }

    async get() {
      const json = await this.safeCall('getBatteryStatus');
      return JSON.parse(json);
    }

    watch(callback, options = {}) {
      const throttleMs = options.throttle || 5000;
      const significantChange = options.significantChange || 1;
      let lastLevel = null;
      
      const checkBattery = async () => {
        try {
          const status = await this.get();
          
          if (lastLevel === null || Math.abs(status.level - lastLevel) >= significantChange) {
            lastLevel = status.level;
            callback(status);
          }
        } catch (error) {
          if (options.onError) {
            options.onError(error);
          }
        }
      };
      
      // Initial check
      checkBattery();
      
      // Set up interval
      const interval = setInterval(checkBattery, throttleMs);
      
      // Return unwatch function
      return () => clearInterval(interval);
    }
  }

export default BatteryBridge;