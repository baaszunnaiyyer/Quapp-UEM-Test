/**
 * Quapp SDK v1.0.0
 * A modern JavaScript SDK for QuappStore native bridges
 * 
 * @license MIT
 * @author QuappStore Team
 */

// import EventEmitter from '../quapp-sdk/utils/'
// import throttle from '../quapp-sdk/utils/throttle';

(function(window) {
  'use strict';

  // Utility: EventEmitter
  class EventEmitter {
    constructor() {
      this.events = {};
    }

    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
      return () => this.off(event, callback);
    }

    off(event, callback) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      }
    }

    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in ${event} handler:`, error);
          }
        });
      }
    }

    once(event, callback) {
      const unsubscribe = this.on(event, (data) => {
        unsubscribe();
        callback(data);
      });
      return unsubscribe;
    }
  }

  // Utility: Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Utility: Create a watchable property
  function createWatchable(getter, options = {}) {
    return {
      get current() {
        return getter();
      },
      
      watch(callback, watchOptions = {}) {
        const opts = { ...options, ...watchOptions };
        const throttleMs = opts.throttle || 1000;
        const throttledCallback = throttle(callback, throttleMs);
        
        // Initial call
        throttledCallback(getter());
        
        // Set up polling
        const interval = setInterval(() => {
          const value = getter();
          if (opts.significantChange) {
            // Only call if significant change
            // Implementation depends on data type
          }
          throttledCallback(value);
        }, throttleMs);
        
        // Return unwatch function
        return () => clearInterval(interval);
      }
    };
  }

  // Base Bridge Wrapper
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

  // Device Bridges (Query Pattern)
  class DeviceBridge extends BridgeWrapper {
    constructor() {
      super('DeviceInfo');
      this._cache = null;
      this._cacheTime = 0;
      this._cacheTimeout = 60000; // 1 minute
    }

    async info(options = {}) {
      if (options.cache && this._cache && (Date.now() - this._cacheTime < this._cacheTimeout)) {
        return this._cache;
      }
      
      const json = await this.safeCall('getDeviceInfo');
      const info = JSON.parse(json);
      
      this._cache = info;
      this._cacheTime = Date.now();
      
      return info;
    }
  }

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

  class StorageBridge extends BridgeWrapper {
    constructor() {
      super('Storage');
    }

    async get() {
      const json = await this.safeCall('getStorageInfo');
      return JSON.parse(json);
    }

    watch(callback, options = {}) {
      const throttleMs = options.throttle || 10000;
      const significantChange = options.significantChange || 100 * 1024 * 1024; // 100MB
      let lastAvailable = null;
      
      const checkStorage = async () => {
        try {
          const info = await this.get();
          
          if (lastAvailable === null || Math.abs(info.internalAvailable - lastAvailable) >= significantChange) {
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

  // Hardware Control Bridges
  class FlashlightBridge extends BridgeWrapper {
    constructor() {
      super('Flashlight');
      this._isOn = false;
    }

    get isOn() {
      return this.available && this._isOn;
    }

    get isAvailable() {
      return this.available && (this.native.isAvailable ? this.native.isAvailable() : true);
    }

    async on() {
      await this.safeCall('setEnabled', true);
      this._isOn = true;
      this.events.emit('change', { isOn: true });
      return true;
    }

    async off() {
      await this.safeCall('setEnabled', false);
      this._isOn = false;
      this.events.emit('change', { isOn: false });
      return true;
    }

    async toggle() {
      const newState = await this.safeCall('toggle');
      this._isOn = newState;
      this.events.emit('change', { isOn: newState });
      return newState;
    }
  }

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

    // Direct methods
    async hide() {
      return this.setVisible(false).apply();
    }

    async show() {
      return this.setVisible(true).apply();
    }
  }

  // Sensor Stream Bridges
  class GyroscopeBridge extends BridgeWrapper {
    constructor() {
      super('Gyroscope');
      this.listening = false;
      this.callbacks = new Set();
      this._lastReading = { x: 0, y: 0, z: 0 };
      this._setupGlobalCallback();
    }

    _setupGlobalCallback() {
      if (this.available) {
        this.callbackName = 'QuappSDK_Gyroscope_' + Date.now();
        window[this.callbackName] = (data) => {
          this._lastReading = data;
          this.callbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error('Gyroscope callback error:', error);
            }
          });
          this.events.emit('data', data);
        };
        this.native.setCallback(this.callbackName);
      }
    }

    get lastReading() {
      return { ...this._lastReading };
    }

    create(options = {}) {
      const bridge = this; // Store reference to bridge
      const sensor = {
        options,
        started: false,
        callback: null,
        
        async start() {
          if (this.started) return;
          
          if (!bridge.listening) {
            await bridge.start();
          }
          
          this.started = true;
          return true;
        },
        
        async stop() {
          if (!this.started) return;
          
          if (this.callback) {
            bridge.callbacks.delete(this.callback);
          }
          
          if (bridge.callbacks.size === 0) {
            await bridge.stop();
          }
          
          this.started = false;
          return true;
        },
        
        async calibrate() {
          // Future implementation
          return true;
        }
      };
      
      // If callback provided, set it up
      if (options.callback) {
        let processedCallback = options.callback;
        
        // Apply throttling if requested
        if (options.throttle) {
          processedCallback = throttle(processedCallback, options.throttle);
        }
        
        // Apply smoothing if requested
        if (options.smooth) {
          const factor = options.smoothingFactor || 0.8;
          let smoothed = { x: 0, y: 0, z: 0 };
          
          const originalCallback = processedCallback;
          processedCallback = (data) => {
            smoothed.x = smoothed.x * factor + data.x * (1 - factor);
            smoothed.y = smoothed.y * factor + data.y * (1 - factor);
            smoothed.z = smoothed.z * factor + data.z * (1 - factor);
            originalCallback(smoothed);
          };
        }
        
        sensor.callback = processedCallback;
        this.callbacks.add(processedCallback);
      }
      
      // Set up event handlers
      if (options.onStart) sensor.events.once('start', options.onStart);
      if (options.onStop) sensor.events.once('stop', options.onStop);
      if (options.onError) sensor.events.on('error', options.onError);
      
      return sensor;
    }

    // Simple API
    call(callback, options = {}) {
      const sensor = this.create({ ...options, callback });
      
      // Auto-start if requested
      if (options.autoStart !== false) {
        sensor.start().catch(error => {
          if (options.onError) {
            options.onError(error);
          } else {
            console.error('Failed to start gyroscope:', error);
          }
        });
      }
      
      return () => sensor.stop();
    }

    async start() {
      if (this.listening) return true;
      
      // Ensure callback is set up
      if (!this.callbackName && this.available) {
        this._setupGlobalCallback();
      }
      
      const success = await this.safeCall('startListening');
      if (!success) throw new Error('Failed to start gyroscope');
      
      this.listening = true;
      this.events.emit('start');
      return true;
    }

    async stop() {
      if (!this.listening) return true;
      
      await this.safeCall('stopListening');
      this.listening = false;
      this.events.emit('stop');
      return true;
    }

    async read() {
      this.checkAvailability();
      const json = await this.safeCall('getLastReading');
      return JSON.parse(json);
    }
  }

  class LocationBridge extends BridgeWrapper {
    constructor() {
      super('Location');
      this.listening = false;
      this.callbacks = new Set();
      this._lastLocation = null;
      this._setupGlobalCallback();
    }

    _setupGlobalCallback() {
      if (this.available) {
        const callbackName = 'QuappSDK_Location_' + Date.now();
        window[callbackName] = (data) => {
          this._lastLocation = data;
          this.callbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error('Location callback error:', error);
            }
          });
          this.events.emit('data', data);
        };
        this.native.setCallback(callbackName);
      }
    }

    async current() {
      const json = await this.safeCall('getLocation');
      const location = JSON.parse(json);
      
      if (location.error) {
        throw new Error(location.error);
      }
      
      return location;
    }

    watch(callback, options = {}) {
      let processedCallback = callback;
      let lastLocation = null;
      
      // Distance filter
      if (options.distanceFilter) {
        const threshold = options.distanceFilter;
        processedCallback = (location) => {
          if (!lastLocation || this._calculateDistance(lastLocation, location) >= threshold) {
            lastLocation = location;
            callback(location);
          }
        };
      }
      
      // Throttling
      if (options.throttle) {
        processedCallback = throttle(processedCallback, options.throttle);
      }
      
      this.callbacks.add(processedCallback);
      
      // Start listening if not already
      if (!this.listening) {
        this.start().catch(error => {
          if (options.onError) {
            options.onError(error);
          }
        });
      }
      
      // Return tracker object
      const tracker = {
        pause: () => {
          this.callbacks.delete(processedCallback);
        },
        
        resume: () => {
          this.callbacks.add(processedCallback);
        },
        
        stop: async () => {
          this.callbacks.delete(processedCallback);
          if (this.callbacks.size === 0) {
            await this.stop();
          }
        },
        
        get lastPosition() {
          return this._lastLocation;
        }
      };
      
      return tracker;
    }

    async start() {
      if (this.listening) return true;
      
      const success = await this.safeCall('startListening');
      if (!success) throw new Error('Failed to start location tracking');
      
      this.listening = true;
      return true;
    }

    async stop() {
      if (!this.listening) return true;
      
      await this.safeCall('stopListening');
      this.listening = false;
      return true;
    }

    _calculateDistance(loc1, loc2) {
      // Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = loc1.lat * Math.PI / 180;
      const φ2 = loc2.lat * Math.PI / 180;
      const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
      const Δλ = (loc2.lon - loc1.lon) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return R * c;
    }
  }

  // UI Bridges
  class PaymentBridge extends BridgeWrapper {
    constructor() {
      super('Payment');
      this._pendingPayments = new Map();
      this._paymentId = 0;
      this._setupGlobalCallback();
    }

    _setupGlobalCallback() {
      if (this.available) {
        window.paid = () => {
          const payment = this._pendingPayments.get(this._currentPaymentId);
          if (payment) {
            payment.resolve({
              success: true,
              transactionId: `TXN_${Date.now()}`,
              timestamp: Date.now()
            });
            this._pendingPayments.delete(this._currentPaymentId);
          }
        };
      }
    }

    async request(options = {}) {
      this.checkAvailability();
      
      const amount = options.amount || 0;
      const currency = options.currency || 'PKR';
      
      return new Promise((resolve, reject) => {
        this._paymentId++;
        this._currentPaymentId = this._paymentId;
        
        // Store handlers
        this._pendingPayments.set(this._currentPaymentId, {
          resolve,
          reject,
          options
        });
        
        // Emit progress
        if (options.onProgress) {
          options.onProgress({ stage: 'initiated', amount, currency });
        }
        
        // Set timeout
        const timeout = options.timeout || 300000; // 5 minutes
        setTimeout(() => {
          const payment = this._pendingPayments.get(this._currentPaymentId);
          if (payment) {
            payment.reject(new Error('Payment timeout'));
            this._pendingPayments.delete(this._currentPaymentId);
          }
        }, timeout);
        
        // Trigger payment
        try {
          this.native.Qpay(amount);
        } catch (error) {
          reject(error);
          this._pendingPayments.delete(this._currentPaymentId);
        }
      });
    }

    // Fluent interface
    amount(value) {
      this._amount = value;
      return this;
    }

    currency(value) {
      this._currency = value;
      return this;
    }

    description(value) {
      this._description = value;
      return this;
    }

    onProgress(callback) {
      this._onProgress = callback;
      return this;
    }

    async execute() {
      return this.request({
        amount: this._amount,
        currency: this._currency,
        description: this._description,
        onProgress: this._onProgress
      });
    }
  }

  // File Bridge
  class FileBridge extends BridgeWrapper {
    constructor() {
      super('File');
    }

    download(data, options = {}) {
      this.checkAvailability();
      
      const filename = options.filename || `download_${Date.now()}.pdf`;
      const events = new EventEmitter();
      
      // Create download handle
      const handle = {
        on: (event, callback) => events.on(event, callback),
        
        promise: new Promise((resolve, reject) => {
          try {
            // Start download
            this.native.getBase64FromBlobData(data);
            
            // Simulate progress events
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += 20;
              events.emit('progress', {
                percent: progress,
                loaded: (data.length * progress) / 100,
                total: data.length
              });
              
              if (progress >= 100) {
                clearInterval(progressInterval);
                const result = {
                  path: `/storage/emulated/0/Download/${filename}`,
                  size: data.length,
                  timestamp: Date.now()
                };
                events.emit('complete', result);
                resolve(result);
              }
            }, 200);
          } catch (error) {
            events.emit('error', error);
            reject(error);
          }
        })
      };
      
      // Add callback style if provided
      if (options.onProgress) {
        handle.on('progress', options.onProgress);
      }
      if (options.onComplete) {
        handle.on('complete', options.onComplete);
      }
      if (options.onError) {
        handle.on('error', options.onError);
      }
      
      return handle;
    }
  }

  // Main Quapp SDK
  class QuappSDK {
    constructor() {
      this.version = '1.0.1';
      this.isQuappEnvironment = !!(window.QuappAvailableBridges && window.QuappDeviceCapabilities);
      
      if (!this.isQuappEnvironment) {
        console.warn('QuappSDK: Not running in a Quapp environment. Some features may not be available.');
      }
      
      // Initialize bridges
      this._initializeBridges();
      
      // Expose capabilities
      this.capabilities = window.QuappDeviceCapabilities || {};
      this.availableBridges = window.QuappAvailableBridges || [];
    }

    _initializeBridges() {
      // Device bridges
      this._deviceBridge = new DeviceBridge();
      this._batteryBridge = new BatteryBridge();
      this._networkBridge = new NetworkBridge();
      this._storageBridge = new StorageBridge();
      
      // Hardware bridges
      this.flashlight = new FlashlightBridge();
      this.statusBar = new StatusBarBridge();
      
      // Sensor bridges
      this.gyroscope = new GyroscopeBridge();
      this.location = new LocationBridge();
      
      // UI bridges
      this.payment = new PaymentBridge();
      
      // File bridges
      this.files = new FileBridge();
      
      // Create device namespace
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
      
      // Create sensors namespace
      this.sensors = {
        gyroscope: (callback, options) => this.gyroscope.call(callback, options),
        location: {
          current: () => this.location.current(),
          watch: (cb, opts) => this.location.watch(cb, opts)
        }
      };
    }

    // Direct access methods
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

    // Utility methods
    isAvailable(bridgeName) {
      return this.availableBridges.includes(bridgeName);
    }

    hasCapability(capability) {
      return this.capabilities[capability] === true;
    }
  }

  // Create and expose the SDK
  window.Quapp = new QuappSDK();
  
  // UMD pattern
  if (typeof define === 'function' && define.amd) {
    define([], () => window.Quapp);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Quapp;
  }

})(typeof window !== 'undefined' ? window : this); 