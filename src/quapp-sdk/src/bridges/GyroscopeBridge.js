import BridgeWrapper from './BridgeWrapper.js';
import throttle from '../utils/throttle.js';

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
        // this.native.setCallback(this.callbackName);
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

  export default GyroscopeBridge;