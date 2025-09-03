import BridgeWrapper from './BridgeWrapper.js';
import EventEmitter from '../utils/EventEmitter.js';


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

export default FileBridge;