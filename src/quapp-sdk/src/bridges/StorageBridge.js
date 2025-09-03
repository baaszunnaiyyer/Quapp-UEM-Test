import BridgeWrapper from "./BridgeWrapper.js";

class StorageBridge extends BridgeWrapper {
  constructor() {
    super("Storage");
  }

  async get() {
    const json = await this.safeCall("getStorageInfo");
    return JSON.parse(json);
  }

  watch(callback, options = {}) {
    const throttleMs = options.throttle || 10000;
    const significantChange = options.significantChange || 100 * 1024 * 1024; // 100MB
    let lastAvailable = null;

    const checkStorage = async () => {
      try {
        const info = await this.get();

        if (
          lastAvailable === null ||
          Math.abs(info.internalAvailable - lastAvailable) >= significantChange
        ) {
          lastAvailable = info.internalAvailable;
          callback(info);
        }
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, throttleMs);
    return () => clearInterval(interval);
  }
}

export default StorageBridge;
