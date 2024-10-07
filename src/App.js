import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [recommendation, setRecommendation] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [cartItems, setCartItems] = useState([]); // State to hold cart items

  const fetchRecommendation = async () => {
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/recommend', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.recommended_item) {
          setRecommendation(response.data.recommended_item);
        } else {
          console.log('No recommendation found.');
        }
      } catch (error) {
        console.error('Error fetching recommendation', error);
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
        } else {
          console.log('No saved items found.');
        }
      } catch (error) {
        console.error('Error fetching saved items', error);
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
        } else {
          console.log('No items in cart.');
        }
      } catch (error) {
        console.error('Error fetching cart items', error);
      }
    }
  };

  const addToCart = async (item) => {
    if (token) {
      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/cart/add',
          {
            clothing_id: item.clothing_id,
            item_name: item.item_name,
            price: item.price,
            quantity: 1,
          },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        console.log('Item added to cart:', response.data);
        fetchCartItems(); // Refresh the cart
      } catch (error) {
        console.error('Error adding item to cart', error);
      }
    }
  };

  const removeFromSavedItems = async (clothing_id) => {
    if (token) {
      try {
        const response = await axios.post(
          `http://127.0.0.1:8000/saved-items/remove?item_id=${clothing_id}`,
          {},
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        console.log('Item removed from saved items:', response.data);
        fetchSavedItems(); // Refresh the saved items list after removing
      } catch (error) {
        console.error('Error removing item from saved items', error);
      }
    }
  };

  const removeFromCart = async (clothing_id) => {
    if (token) {
      try {
        const response = await axios.post(
          `http://127.0.0.1:8000/cart/remove?clothing_id=${clothing_id}`,  // Pass ID as query param
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Item removed from cart:', response.data);
        fetchCartItems(); // Refresh the cart after removing
      } catch (error) {
        console.error('Error removing item from cart', error);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecommendation();
    }
  }, [token]);

  const submitFeedback = async (liked) => {
    if (!recommendation) return;

    try {
      await axios.post(
        'http://127.0.0.1:8000/feedback',
        { item_id: recommendation.clothing_id, liked },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setFeedback(liked ? 'Liked!' : 'Disliked!');
      setTimeout(() => {
        setFeedback(null);
        setRecommendation(null);
        fetchRecommendation();
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback', error);
    }
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

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
          <p>Brand: {recommendation.brand || 'No brand available'}</p>
          <p>Category: {recommendation.category || 'No category available'}</p>
          <p>Price: {recommendation.price ? `$${recommendation.price}` : 'No price available'}</p>
          <div>
            <button onClick={() => submitFeedback(true)}>Like</button>
            <button onClick={() => submitFeedback(false)}>Dislike</button>
            <button onClick={() => addToCart(recommendation)}>Add to Cart</button>
            {feedback && <p>{feedback}</p>}
          </div>
        </div>
      ) : (
        <p>Loading recommendation...</p>
      )}

      <h2>Saved Items</h2>
      <button onClick={fetchSavedItems}>Show Saved Items</button>
      {savedItems.length > 0 ? (
        <div>
          {savedItems.map((item) => (
            <div key={item.clothing_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px' }}>
              <h3>{item.item_name}</h3>
              <p>Brand: {item.brand}</p>
              <p>Category: {item.category}</p>
              <p>Price: {item.price ? `$${item.price}` : 'No price available'}</p>
              <a href={item.url || '#'} target="_blank" rel="noopener noreferrer">
                View Product
              </a>
              <div>
                <button onClick={() => addToCart(item)}>Add to Cart</button>
                <button onClick={() => removeFromSavedItems(item.clothing_id)}>Remove from Saved Items</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No saved items to show.</p>
      )}

      <h2>Cart</h2>
      <button onClick={fetchCartItems}>Show Cart</button>
      {cartItems.length > 0 ? (
        <div>
          {cartItems.map((item) => (
            <div key={item.clothing_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px' }}>
              <h3>{item.item_name}</h3>
              <p>Price: ${item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <button onClick={() => removeFromCart(item.clothing_id)}>Remove from Cart</button>
            </div>
          ))}
        </div>
      ) : (
        <p>No items in cart.</p>
      )}
    </div>
  );
}

export default App;
