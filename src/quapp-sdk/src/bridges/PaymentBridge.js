import BridgeWrapper from './BridgeWrapper.js';

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

export default PaymentBridge;