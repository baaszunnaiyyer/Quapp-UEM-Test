# Quapp SDK 🧩

A lightweight JavaScript SDK that provides a unified interface to interact with native mobile device features in a Quapp environment.

> ✨ Built with extensibility in mind — Add your own bridges easily.

---

## 📦 Installation

```bash
npm install quapp-sdk
```
or 
```bash
yarn add quapp-sdk
```
## 
## 🚀 Getting Started
### Import the SDK

```javascript
import Quapp from "quapp-sdk"
```
##

### 🧠 How It Works

`QuappSDK` dynamically connects to the available native bridges and device capabilities exposed via `window.QuappAvailableBridges` and `window.QuappDeviceCapabilities`.
## 

## 🧱Built-In Bridges 

| Bridge       | Purpose                         |
| ------------ | ------------------------------- |
| `flashlight` | Toggle flashlight on/off        |
| `statusBar`  | Set color, visibility & style   |
| `battery`    | Access battery level & charging |
| `vibrate`    | Trigger device vibration        |
| `volume`     | Set or get volume levels        |
| `brightness` | Control screen brightness       |
| `torch`      | Enable/disable torch            |
| `deviceInfo` | Get device name, OS, version    |

## 

## 🌍 Environment Detection

The SDK will warn you if you're not inside a Quapp-supported environment:
```bash
if (!Quapp.isQuappEnvironment) {
  console.warn("Not running in a Quapp environment.");
}
```

## 

## 📂 Project Structure

```bash

quapp-sdk/
├── src/
│   ├── bridges/
│   │   ├── FlashlightBridge.js
│   │   ├── StatusBarBridge.js
│   │   ├── BatteryBridge.js
│   │   └── ... (other bridges)
│   ├── core/
│   │   ├── BridgeWrapper.js
│   │   └── EventEmitter.js
│   └── QuappSDK.js
├── index.js             # Exports QuappSDK instance
├── package.json
├── README.md
└── index.d.ts           # Type definitions
```

## 

## 📜 Types

Type definitions are automatically included.

```ts
import Quapp from 'quapp-sdk';

Quapp.flashlight.on(): Promise<boolean>;
Quapp.statusBar.setColor(color).setVisible(true).apply(): Promise<boolean>;
```

## 
## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 
## ⚠️ License
MIT
## 

Made with ❤️ By the members Of Quapp Community.