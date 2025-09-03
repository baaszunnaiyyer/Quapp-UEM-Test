// bridges/NetworkBridge.js

import BridgeWrapper from './BridgeWrapper.js';

class NetworkBridge extends BridgeWrapper {
  constructor() {
    super('Network');
  }

  async get() {
    const json = await this.safeCall('getNetworkStatus');
    return JSON.parse(json);
  }

  watch(callback, options = {}) {
    const throttleMs = options.throttle || 3000;
    let lastType = null;
    let lastConnected = null;

    const checkNetwork = async () => {
      try {
        const status = await this.get();

        if (status.type !== lastType || status.isConnected !== lastConnected) {
          lastType = status.type;
          lastConnected = status.isConnected;
          callback(status);
        }
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, throttleMs);
    return () => clearInterval(interval);
  }
}

export default NetworkBridge;
