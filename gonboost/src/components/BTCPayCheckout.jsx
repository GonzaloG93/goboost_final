// components/BTCPayCheckout.jsx
import React, { useState } from 'react';
import useBTCPay from '../hooks/useBTCPay';

const BTCPayCheckout = ({ storeId, defaultAmount = 0.001 }) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState(`ORDER-${Date.now()}`);
  
  const {
    createInvoice,
    redirectToCheckout,
    loading,
    error,
    invoice
  } = useBTCPay({ storeId });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const invoiceData = {
      amount,
      currency: 'BTC',
      metadata: {
        orderId,
        buyerEmail: email,
      },
    };

    try {
      const newInvoice = await createInvoice(invoiceData);
      redirectToCheckout(newInvoice);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  if (invoice) {
    return (
      <div className="btcpay-success">
        <h3>Invoice Created!</h3>
        <p>Redirecting to payment...</p>
        <p>
          <a href={invoice.checkoutLink} target="_blank" rel="noopener">
            Click here if not redirected
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="btcpay-checkout">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount (BTC):</label>
          <input
            type="number"
            step="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.00001"
            required
          />
        </div>

        <div className="form-group">
          <label>Email (optional):</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        {error && (
          <div className="btcpay-error">
            Error: {error.message || JSON.stringify(error)}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="btcpay-submit-btn"
        >
          {loading ? 'Creating Invoice...' : 'Pay with Bitcoin'}
        </button>
      </form>
    </div>
  );
};

export default BTCPayCheckout;