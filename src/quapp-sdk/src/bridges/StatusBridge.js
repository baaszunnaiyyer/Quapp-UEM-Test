import BridgeWrapper from './BridgeWrapper.js';

class StatusBarBridge extends BridgeWrapper {
  constructor() {
    super('StatusBar');
    this._config = {};
  }

  setColor(color) {
    this._config.color = color;
    return this;
  }

  setStyle(style) {
    this._config.style = style;
    return this;
  }

  setVisible(visible) {
    this._config.visible = visible;
    return this;
  }

  async apply() {
    this.checkAvailability();

    if (this._config.color && this._config.style !== undefined) {
      await this.safeCall('setColor', this._config.color, this._config.style === 'dark');
    }

    if (this._config.visible !== undefined) {
      await this.safeCall('setVisible', this._config.visible);
    }

    this._config = {};
    return true;
  }

  async hide() {
    return this.setVisible(false).apply();
  }

  async show() {
    return this.setVisible(true).apply();
  }
}

export default StatusBarBridge;
