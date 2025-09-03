import DeviceBridge from './bridges/DeviceBridge.js';
import BatteryBridge from './bridges/BatteryBridge.js';
import NetworkBridge from './bridges/NetworkBridge.js';
import StorageBridge from './bridges/StorageBridge.js';
import FlashlightBridge from './bridges/FlashlightBridge.js';
import StatusBarBridge from './bridges/StatusBridge.js';
import GyroscopeBridge from './bridges/GyroscopeBridge.js';
import LocationBridge from './bridges/LocationBridge.js';
import PaymentBridge from './bridges/PaymentBridge.js';
import FileBridge from './bridges/FileBridge.js';

class QuappSDK {
  constructor() {
    this.version = '1.0.1';
    this.isQuappEnvironment = !!(window.QuappAvailableBridges && window.QuappDeviceCapabilities);

    if (!this.isQuappEnvironment) {
      console.warn('QuappSDK: Not running in a Quapp environment. Some features may not be available.');
    }

    this._initializeBridges();

    this.capabilities = window.QuappDeviceCapabilities || {};
    this.availableBridges = window.QuappAvailableBridges || [];
  }

  _initializeBridges() {
    this._deviceBridge = new DeviceBridge();
    this._batteryBridge = new BatteryBridge();
    this._networkBridge = new NetworkBridge();
    this._storageBridge = new StorageBridge();

    this.flashlight = new FlashlightBridge();
    this.statusBar = new StatusBarBridge();

    this.gyroscope = new GyroscopeBridge();
    this.location = new LocationBridge();

    this.payment = new PaymentBridge();
    this.files = new FileBridge();

    this.device = {
      info: (options) => this._deviceBridge.info(options),
      battery: Object.assign(
        () => this._batteryBridge.get(),
        { watch: (cb, opts) => this._batteryBridge.watch(cb, opts) }
      ),
      network: Object.assign(
        () => this._networkBridge.get(),
        { watch: (cb, opts) => this._networkBridge.watch(cb, opts) }
      ),
      storage: Object.assign(
        () => this._storageBridge.get(),
        { watch: (cb, opts) => this._storageBridge.watch(cb, opts) }
      )
    };

    this.sensors = {
      gyroscope: (callback, options) => this.gyroscope.call(callback, options),
      location: {
        current: () => this.location.current(),
        watch: (cb, opts) => this.location.watch(cb, opts)
      }
    };
  }

  async getDeviceInfo(options) {
    return this.device.info(options);
  }

  async getBattery() {
    return this.device.battery();
  }

  async getNetwork() {
    return this.device.network();
  }

  async getStorage() {
    return this.device.storage();
  }

  async getLocation() {
    return this.location.current();
  }

  watchGyroscope(callback, options) {
    return this.gyroscope.call(callback, options);
  }

  watchLocation(callback, options) {
    return this.location.watch(callback, options);
  }

  async enableFlashlight() {
    return this.flashlight.on();
  }

  async disableFlashlight() {
    return this.flashlight.off();
  }

  async toggleFlashlight() {
    return this.flashlight.toggle();
  }

  async setStatusBar(options) {
    const bar = this.statusBar;
    if (options.color) bar.setColor(options.color);
    if (options.style) bar.setStyle(options.style);
    if (options.visible !== undefined) bar.setVisible(options.visible);
    return bar.apply();
  }

  async requestPayment(options) {
    return this.payment.request(options);
  }

  downloadFile(data, options) {
    return this.files.download(data, options);
  }

  isAvailable(bridgeName) {
    return this.availableBridges.includes(bridgeName);
  }

  hasCapability(capability) {
    return this.capabilities[capability] === true;
  }
}

export default QuappSDK;
