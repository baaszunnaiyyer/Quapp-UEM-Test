// bridges/DeviceBridge.js

import BridgeWrapper from "./BridgeWrapper.js";

class DeviceBridge extends BridgeWrapper {
  constructor() {
    super("DeviceInfo");
    this._cache = null;
    this._cacheTime = 0;
    this._cacheTimeout = 60000; // 1 minute
  }

  async info(options = {}) {
    if (
      options.cache &&
      this._cache &&
      Date.now() - this._cacheTime < this._cacheTimeout
    ) {
      return this._cache;
    }

    const json = await this.safeCall("getDeviceInfo");
    const info = JSON.parse(json);

    this._cache = info;
    this._cacheTime = Date.now();

    return info;
  }
}

export default DeviceBridge;
