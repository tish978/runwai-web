// src/components/CheckoutForm.js

import React, { useState } from 'react';
import axios from 'axios';

const CheckoutForm = ({ items, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Assuming you have an API endpoint to create a checkout session
      const response = await axios.post('http://127.0.0.1:8000/create-checkout-session', { items });
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setError('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      {items && items.length > 0 ? (
        <div>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.item_name} - ${item.price} x {item.quantity}
              </li>
            ))}
          </ul>
          <button onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
          {error && <p>{error}</p>}
        </div>
      ) : (
        <p>No items in the cart.</p>
      )}
    </div>
  );
};

export default CheckoutForm;
