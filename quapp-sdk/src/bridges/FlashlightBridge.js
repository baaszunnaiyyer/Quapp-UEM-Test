import BridgeWrapper from "./BridgeWrapper.js";

/**
 * FlashlightBridge provides control over the device's flashlight.
 */
class FlashlightBridge extends BridgeWrapper {
  constructor() {
    super("Flashlight");
    this._isOn = false;
  }

  /**
   * Returns true if the flashlight is available and currently turned on.
   */
  get isOn() {
    return this.available && this._isOn;
  }

  /**
   * Checks if flashlight functionality is available.
   */
  get isAvailable() {
    if (!this.available) return false;
    return typeof this.native.isAvailable === "function"
      ? this.native.isAvailable()
      : true;
  }

  /**
   * Turns the flashlight on.
   */
  async on() {
    await this.safeCall("setEnabled", true);
    this._isOn = true;
    this.events.emit("change", { isOn: true });
    return true;
  }

  /**
   * Turns the flashlight off.
   */
  async off() {
    await this.safeCall("setEnabled", false);
    this._isOn = false;
    this.events.emit("change", { isOn: false });
    return true;
  }

  /**
   * Toggles the flashlight state.
   */
  async toggle() {
    const newState = await this.safeCall("toggle");
    this._isOn = newState;
    this.events.emit("change", { isOn: newState });
    return newState;
  }
}

export default FlashlightBridge;