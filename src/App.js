import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import Login from './components/Login';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51Q7NqdGpfvzWqvI6IstFprvP98VrLTIwcdeDDPI6a1GBn8Gp1eH6Eun72CgjNzVkXiLd4AeSHm1fL5F4iFyFPQlz006ikxdHwU');

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [recommendation, setRecommendation] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  const fetchRecommendation = async () => {
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/recommend', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.recommended_item) {
          setRecommendation(response.data.recommended_item);
        }
      } catch (error) {
        console.error('Error fetching recommendation:', error);
      }
    }
  };

  const fetchCartItems = async () => {
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.cart_items) {
          setCartItems(response.data.cart_items);
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
      }
    }
  };

  const handleCheckout = async () => {
    if (token) {
      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/create-checkout-session',
          cartItems,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );

        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId,
        });

        if (result.error) {
          setCheckoutStatus('Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during checkout:', error);
        setCheckoutStatus('Payment failed. Please try again.');
      }

      setTimeout(() => {
        setCheckoutStatus(null);
      }, 5000);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecommendation();
      fetchCartItems();
    }
  }, [token]);

  return (
    <div>
      <h2>Recommendation</h2>
      {recommendation ? (
        <div>
          <img
            src={recommendation.image_url || 'placeholder_image_url_here'}
            alt={recommendation.item_name || 'No image available'}
            style={{ width: '200px', height: 'auto' }}
          />
          <h3>{recommendation.item_name || 'No item name available'}</h3>
          <p>Price: {recommendation.price ? `$${recommendation.price}` : 'No price available'}</p>
        </div>
      ) : (
        <p>Loading recommendation...</p>
      )}

      <h2>Cart</h2>
      {cartItems.length > 0 ? (
        <div>
          {cartItems.map((item) => (
            <div key={item.clothing_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px' }}>
              <h3>{item.item_name}</h3>
              <p>Price: ${item.price}</p>
              <p>Quantity: {item.quantity}</p>
            </div>
          ))}
          <button onClick={handleCheckout}>Checkout</button>
        </div>
      ) : (
        <p>No items in cart.</p>
      )}
      {checkoutStatus && <p>{checkoutStatus}</p>}
    </div>
  );
}

// Success component to handle successful purchase
function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    if (sessionId) {
      // Fetch session details from your backend
      axios.get(`http://127.0.0.1:8000/stripe-session/${sessionId}`)
        .then((response) => {
          setSessionDetails(response.data);
        })
        .catch((error) => {
          console.error('Error fetching session details:', error);
        });
    }
  }, [sessionId]);

  return (
    <div>
      <h2>Payment Success!</h2>
      {sessionDetails ? (
        <div>
          <p>Thank you for your purchase! Your session ID is: {sessionDetails.id}</p>
          <p>Amount Paid: ${sessionDetails.amount_total / 100}</p>
          <a href="/digital-closet">Go to your Digital Closet</a>
        </div>
      ) : (
        <p>Loading payment details...</p>
      )}
    </div>
  );
}

// Digital Closet page to display purchased items
function DigitalCloset() {
  const [purchasedItems, setPurchasedItems] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/digital-closet', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((response) => {
          setPurchasedItems(response.data);
        })
        .catch((error) => {
          console.error('Error fetching purchased items:', error);
        });
    }
  }, [token]);
  

  return (
    <div>
      <h2>Your Digital Closet</h2>
      {purchasedItems.length > 0 ? (
        <div className="closet-grid">
          {purchasedItems.map((item) => (
            <div key={item.clothing_id} className="closet-item">
              <img src={item.image_url} alt={item.item_name} style={{ width: '150px', height: 'auto' }} />
              <h3>{item.item_name}</h3>
              <p>Price: ${item.price}</p>
              <p>Purchased on: {new Date(item.purchase_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No items in your closet.</p>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <Router>
      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/success" element={<Success />} />
          <Route path="/digital-closet" element={<DigitalCloset />} />
        </Routes>
      )}
    </Router>
  );
}
