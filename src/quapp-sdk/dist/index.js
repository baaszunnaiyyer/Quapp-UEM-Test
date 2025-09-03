import QuappSDK from '../src/QuappSDK.js';
import BatteryBridge from '../src/bridges/BatteryBridge.js';
import DeviceBridge from '../src/bridges/DeviceBridge.js';
import NetworkBridge from '../src/bridges/NetworkBridge.js';
import StorageBridge from '../src/bridges/StorageBridge.js';
import FlashlightBridge from '../src/bridges/FlashlightBridge.js';
import StatusBarBridge from '../src/bridges/StatusBridge.js';
import GyroscopeBridge from '../src/bridges/GyroscopeBridge.js';
import LocationBridge from '../src/bridges/LocationBridge.js';
import PaymentBridge from '../src/bridges/PaymentBridge.js';
import FileBridge from '../src/bridges/FileBridge.js';

// Assign to window
const Quapp = new QuappSDK();
if (typeof window !== 'undefined') {
    window.Quapp = Quapp;
}

// UMD exports
if (typeof define === 'function' && define.amd) {
    define([], () => Quapp);
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Quapp;
    module.exports.BatteryBridge = BatteryBridge;
    module.exports.DeviceBridge = DeviceBridge;
    module.exports.NetworkBridge = NetworkBridge;
    module.exports.StorageBridge = StorageBridge;
    module.exports.FlashlightBridge = FlashlightBridge;
    module.exports.StatusBarBridge = StatusBarBridge;
    module.exports.GyroscopeBridge = GyroscopeBridge;
    module.exports.LocationBridge = LocationBridge;
    module.exports.PaymentBridge = PaymentBridge;
    module.exports.FileBridge = FileBridge;
} else {
    // Allow direct access in browser as:
    // import Quapp, { BatteryBridge } from 'quapp-sdk';
    window.Quapp = Quapp;
window.BatteryBridge = BatteryBridge;
}

export default Quapp;
export { BatteryBridge, FlashlightBridge, DeviceBridge, NetworkBridge, StorageBridge, StatusBarBridge, GyroscopeBridge, LocationBridge, PaymentBridge, FileBridge };
