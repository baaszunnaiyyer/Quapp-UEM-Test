import BridgeWrapper from './BridgeWrapper.js';
import throttle from '../utils/throttle.js';


class LocationBridge extends BridgeWrapper {
    constructor() {
      super('Location');
      this.listening = false;
      this.callbacks = new Set();
      this._lastLocation = null;
      this._setupGlobalCallback();
    }

    _setupGlobalCallback() {
      if (this.available && typeof this.native.setCallback === 'function') {
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

        // this.native.setCallback(callbackName);
      } else {
        console.warn(`[LocationBridge] Native bridge does not support setCallback`);
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

export default LocationBridge;