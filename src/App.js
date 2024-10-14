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
  const [savedItems, setSavedItems] = useState([]); // New state for saved items

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

  const fetchSavedItems = async () => {
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/saved-items', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.liked_items) {
          setSavedItems(response.data.liked_items);
        }
      } catch (error) {
        console.error('Error fetching saved items:', error);
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

  const handleFeedback = async (liked) => {
    if (token && recommendation) {
      try {
        // Send feedback (liked/disliked)
        const feedbackData = {
          item_id: recommendation.clothing_id,
          liked: liked,  // liked will be true for Like button, false for Dislike button
        };
  
        const feedbackResponse = await axios.post(
          'http://127.0.0.1:8000/feedback',
          feedbackData,
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
  
        console.log('Feedback sent:', feedbackResponse.data);
  
        // Fetch a new recommendation after sending feedback
        const newRecommendationResponse = await axios.get(
          'http://127.0.0.1:8000/recommend',
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
  
        setRecommendation(newRecommendationResponse.data.recommended_item);
        console.log('New recommendation:', newRecommendationResponse.data.recommended_item);
  
      } catch (error) {
        console.error('Error submitting feedback or fetching new recommendation:', error);
      }
    }
  };
  

// Function to handle adding items to the cart
const handleAddToCart = async (item) => {
  if (token && item) {
    try {
      const cartItem = {
        clothing_id: item.clothing_id,
        item_name: item.item_name,
        price: item.price,
      };
      const response = await axios.post(
        'http://127.0.0.1:8000/cart/add',
        cartItem,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );
      console.log('Item added to cart:', response.data);
      fetchCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }
};


  // Function to save an item to favorites
  const handleSaveItem = async () => {
    if (token && recommendation) {
      try {
        const savedItem = {
          item_id: recommendation.clothing_id,
          liked: true,
        };
        const response = await axios.post(
          'http://127.0.0.1:8000/feedback',
          savedItem,
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        console.log('Item saved to favorites:', response.data);
        fetchSavedItems(); // Refresh saved items after saving
      } catch (error) {
        console.error('Error saving item to favorites:', error);
      }
    }
  };

  // Function to remove an item from saved items
  const handleRemoveSavedItem = async (item_id) => {
    if (token) {
      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/saved-items/remove',
          { item_id },  // Send item_id in the body as expected by FastAPI
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        console.log('Item removed from saved items:', response.data);
        fetchSavedItems(); // Refresh saved items after removal
      } catch (error) {
        console.error('Error removing saved item:', error);
      }
    }
  };

  const handleRemoveFromCart = async (clothing_id) => {
    if (token) {
      try {
        // Remove item from backend
        const response = await axios.post(
          `http://127.0.0.1:8000/cart/remove?clothing_id=${clothing_id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
  
        if (response.status === 200) {
          console.log('Item removed from cart:', response.data);
  
          // Update the local cartItems state by removing the item
          setCartItems((prevCartItems) =>
            prevCartItems.filter((item) => item.clothing_id !== clothing_id)
          );
        } else {
          console.log(response.data.message); // Handle not found case
        }
  
        // Check if the cart is now empty and handle UI accordingly
        if (cartItems.length === 1) {
          setCartItems([]);  // If only one item was left, set cartItems to an empty array
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
      }
    }
  };
  
  
  

  

  useEffect(() => {
    if (token) {
      fetchRecommendation();
      fetchCartItems();
      fetchSavedItems(); // Fetch saved items on load
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
          <button onClick={() => handleFeedback(true)}>Like</button>
          <button onClick={() => handleFeedback(false)}>Dislike</button>
          <button onClick={() => handleAddToCart(recommendation)}>Add to Cart</button>
          <button onClick={() => handleSaveItem(recommendation)}>Save Item</button>
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
              {/* Add Remove from Cart button */}
              <button onClick={() => handleRemoveFromCart(item.clothing_id)}>Remove from Cart</button>
            </div>
          ))}
          <button onClick={handleCheckout}>Checkout</button>
        </div>
      ) : (
        <p>No items in cart.</p>
      )}
      {checkoutStatus && <p>{checkoutStatus}</p>}
  
      <h2>Saved Items</h2>
      {savedItems.length > 0 ? (
        <div>
          {savedItems.map((item) => (
            <div key={item.clothing_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px' }}>
              <h3>{item.item_name}</h3>
              <p>Price: ${item.price}</p>
              {/* Add to Cart button */}
              <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
              {/* Remove from Saved Items button */}
              <button onClick={() => handleRemoveSavedItem(item.clothing_id)}>Remove from Saved Items</button>
            </div>
          ))}
        </div>
      ) : (
        <p>No saved items.</p>
      )}
    </div>
  );
  
  
  
}



// Success component to handle successful purchase
function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionDetails, setSessionDetails] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (sessionId && token) {
      // Call /purchase-success to update the closet on successful payment
      axios.post('http://127.0.0.1:8000/purchase-success', 
        { stripe_session_id: sessionId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('Purchase success response:', response.data);
      })
      .catch((error) => {
        console.error('Error processing purchase success:', error);
      });

      // Fetch session details from your backend for confirmation
      axios.get(`http://127.0.0.1:8000/stripe-session/${sessionId}`)
        .then((response) => {
          setSessionDetails(response.data);
        })
        .catch((error) => {
          console.error('Error fetching session details:', error);
        });
    }
  }, [sessionId, token]);

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
