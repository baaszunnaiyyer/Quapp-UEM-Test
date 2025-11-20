/**
 * TypeScript definitions for Quapp SDK v1.0.0
 * Provides type safety and IntelliSense for JavaScript developers
 */

declare module 'quapp-sdk' {
  export = Quapp;
}

declare namespace Quapp {
  // Device capability types
  interface DeviceCapabilities {
    hasGyroscope: boolean;
    hasAccelerometer: boolean;
    hasNFC: boolean;
    hasFlashlight: boolean;
    hasGPS: boolean;
  }

  // Bridge availability
  type BridgeName = 
    | 'DeviceInfo' 
    | 'Battery' 
    | 'Network' 
    | 'Storage' 
    | 'Location'
    | 'Gyroscope' 
    | 'Payment' 
    | 'StatusBar' 
    | 'Flashlight' 
    | 'File';

  // Data types
  interface DeviceInfo {
    deviceId: string;
    model: string;
    manufacturer: string;
    brand: string;
    androidVersion: string;
    sdkVersion: number;
    appVersion: string;
    appVersionCode: number;
    screenWidth: number;
    screenHeight: number;
    density: number;
    language: string;
    country: string;
    timezone: string;
  }

  interface BatteryStatus {
    level: number;          // 0-100
    isCharging: boolean;
    pluggedIn: 'AC' | 'USB' | 'WIRELESS' | 'UNKNOWN' | null;
    health: 'GOOD' | 'OVERHEAT' | 'DEAD' | 'OVER_VOLTAGE' | 'UNKNOWN';
    temperature: number;    // in Celsius
    voltage: number;        // in millivolts
  }

  interface NetworkStatus {
    isConnected: boolean;
    type: 'WIFI' | 'MOBILE' | 'ETHERNET' | 'BLUETOOTH' | 'VPN' | 'UNKNOWN' | null;
    isMetered: boolean;
    isRoaming?: boolean;
    ssid?: string;         // WiFi only
    bssid?: string;        // WiFi only
    linkSpeed?: number;    // WiFi only, Mbps
    signalStrength?: number; // dBm
    ipAddress?: string;
    macAddress?: string;
  }

  interface StorageInfo {
    internalTotal: number;      // bytes
    internalAvailable: number;  // bytes
    internalUsed: number;       // bytes
    internalUsedPercent: number; // 0-100
    externalTotal?: number;
    externalAvailable?: number;
    externalUsed?: number;
    externalUsedPercent?: number;
    appSize: number;
    cacheSize: number;
    dataSize: number;
  }

  interface LocationData {
    lat: number;
    lon: number;
    accuracy: number;      // meters
    timestamp: number;     // Unix timestamp
    altitude?: number;     // meters
    speed?: number;        // m/s
    bearing?: number;      // degrees
    provider?: 'GPS' | 'NETWORK' | 'FUSED';
  }

  interface GyroscopeData {
    x: number;  // rad/s around X axis
    y: number;  // rad/s around Y axis
    z: number;  // rad/s around Z axis
    timestamp?: number;
  }

  // Options
  interface WatchOptions {
    throttle?: number;         // ms between updates
    significantChange?: number; // threshold for change detection
    onError?: (error: Error) => void;
  }

  interface LocationWatchOptions extends WatchOptions {
    highAccuracy?: boolean;
    distanceFilter?: number;   // meters
    timeout?: number;          // ms
    maximumAge?: number;       // ms
  }

  interface GyroscopeOptions {
    frequency?: number;        // Hz
    throttle?: number;        // ms
    smooth?: boolean;
    smoothingFactor?: number; // 0-1
    autoStart?: boolean;
    callback?: (data: GyroscopeData) => void;
    onStart?: () => void;
    onStop?: () => void;
    onError?: (error: Error) => void;
  }

  interface PaymentOptions {
    amount: number;
    currency?: string;
    description?: string;
    timeout?: number;
    onProgress?: (stage: PaymentProgress) => void;
  }

  interface PaymentProgress {
    stage: 'initiated' | 'processing' | 'completed';
    amount: number;
    currency: string;
  }

  interface PaymentResult {
    success: boolean;
    transactionId: string;
    timestamp: number;
  }

  interface DownloadOptions {
    filename?: string;
    onProgress?: (progress: ProgressInfo) => void;
    onComplete?: (result: DownloadResult) => void;
    onError?: (error: Error) => void;
  }

  interface ProgressInfo {
    percent: number;
    loaded: number;
    total: number;
  }

  interface DownloadResult {
    path: string;
    size: number;
    timestamp: number;
  }

  interface DownloadHandle {
    on(event: 'progress', callback: (progress: ProgressInfo) => void): void;
    on(event: 'complete', callback: (result: DownloadResult) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    promise: Promise<DownloadResult>;
  }

  // Tracker interfaces
  interface LocationTracker {
    pause(): void;
    resume(): void;
    stop(): Promise<void>;
    readonly lastPosition: LocationData | null;
  }

  interface UnwatchFunction {
    (): void;
  }

  // Bridge interfaces
  interface DeviceBridges {
    info(options?: { cache?: boolean }): Promise<DeviceInfo>;
    battery(): Promise<BatteryStatus>;
    battery: {
      (): Promise<BatteryStatus>;
      watch(callback: (status: BatteryStatus) => void, options?: WatchOptions): UnwatchFunction;
    };
    network(): Promise<NetworkStatus>;
    network: {
      (): Promise<NetworkStatus>;
      watch(callback: (status: NetworkStatus) => void, options?: WatchOptions): UnwatchFunction;
    };
    storage(): Promise<StorageInfo>;
    storage: {
      (): Promise<StorageInfo>;
      watch(callback: (info: StorageInfo) => void, options?: WatchOptions): UnwatchFunction;
    };
  }

  interface FlashlightBridge {
    readonly isOn: boolean;
    readonly isAvailable: boolean;
    on(): Promise<boolean>;
    off(): Promise<boolean>;
    toggle(): Promise<boolean>;
  }

  interface StatusBarBridge {
    setColor(color: string): StatusBarBridge;
    setStyle(style: 'light' | 'dark'): StatusBarBridge;
    setVisible(visible: boolean): StatusBarBridge;
    apply(): Promise<boolean>;
    hide(): Promise<boolean>;
    show(): Promise<boolean>;
  }

  interface GyroscopeBridge {
    readonly lastReading: GyroscopeData;
    create(options?: GyroscopeOptions): GyroscopeSensor;
    call(callback: (data: GyroscopeData) => void, options?: GyroscopeOptions): UnwatchFunction;
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
    read(): Promise<GyroscopeData>;
  }

  interface GyroscopeSensor {
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
    calibrate(): Promise<boolean>;
  }

  interface LocationBridge {
    current(): Promise<LocationData>;
    watch(callback: (location: LocationData) => void, options?: LocationWatchOptions): LocationTracker;
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
  }

  interface PaymentBridge {
    request(options: PaymentOptions): Promise<PaymentResult>;
    amount(value: number): PaymentBridge;
    currency(value: string): PaymentBridge;
    description(value: string): PaymentBridge;
    onProgress(callback: (progress: PaymentProgress) => void): PaymentBridge;
    execute(): Promise<PaymentResult>;
  }

  interface FileBridge {
    download(data: string, options?: DownloadOptions): DownloadHandle;
  }

  interface SensorsBridges {
    gyroscope(callback: (data: GyroscopeData) => void, options?: GyroscopeOptions): UnwatchFunction;
    location: {
      current(): Promise<LocationData>;
      watch(callback: (location: LocationData) => void, options?: LocationWatchOptions): LocationTracker;
    };
  }

  // Main SDK interface
  interface QuappSDK {
    readonly version: string;
    readonly isQuappEnvironment: boolean;
    readonly capabilities: DeviceCapabilities;
    readonly availableBridges: BridgeName[];

    // Namespaces
    device: DeviceBridges;
    sensors: SensorsBridges;
    flashlight: FlashlightBridge;
    statusBar: StatusBarBridge;
    gyroscope: GyroscopeBridge;
    location: LocationBridge;
    payment: PaymentBridge;
    files: FileBridge;

    // Direct access methods
    getDeviceInfo(options?: { cache?: boolean }): Promise<DeviceInfo>;
    getBattery(): Promise<BatteryStatus>;
    getNetwork(): Promise<NetworkStatus>;
    getStorage(): Promise<StorageInfo>;
    getLocation(): Promise<LocationData>;
    
    watchGyroscope(callback: (data: GyroscopeData) => void, options?: GyroscopeOptions): UnwatchFunction;
    watchLocation(callback: (location: LocationData) => void, options?: LocationWatchOptions): LocationTracker;
    
    enableFlashlight(): Promise<boolean>;
    disableFlashlight(): Promise<boolean>;
    toggleFlashlight(): Promise<boolean>;
    
    setStatusBar(options: { color?: string; style?: 'light' | 'dark'; visible?: boolean }): Promise<boolean>;
    requestPayment(options: PaymentOptions): Promise<PaymentResult>;
    downloadFile(data: string, options?: DownloadOptions): DownloadHandle;

    // Utility methods
    isAvailable(bridge: BridgeName): boolean;
    hasCapability(capability: keyof DeviceCapabilities): boolean;
  }
}

// Global declaration
declare global {
  interface Window {
    Quapp: Quapp.QuappSDK;
  }
}

declare const Quapp: Quapp.QuappSDK; 