// bridges/BridgeWrapper.js

import EventEmitter from "../utils/EventEmitter.js";

class BridgeWrapper {
  constructor(bridgeName) {
    this.bridgeName = bridgeName;
    this.native = window[bridgeName];
    this.available = !!this.native;
    this.events = new EventEmitter();
  }

  checkAvailability() {
    if (!this.available) {
      throw new Error(`${this.bridgeName} bridge is not available on this device`);
    }
  }

  async safeCall(method, ...args) {
    this.checkAvailability();
    try {
      return await Promise.resolve(this.native[method](...args));
    } catch (error) {
      throw new Error(`${this.bridgeName}.${method} failed: ${error.message}`);
    }
  }
}

export default BridgeWrapper;
