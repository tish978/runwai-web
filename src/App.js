import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token')); // Load token from localStorage
  const [recommendation, setRecommendation] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [savedItems, setSavedItems] = useState([]); // State to hold saved items

  // Function to fetch a recommendation
  const fetchRecommendation = async () => {
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/recommend', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Log the full response to make sure we are receiving the right data
        console.log('Full recommendation response:', response.data);

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

  // Function to fetch saved items
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

  // Fetch recommendation after login
  useEffect(() => {
    if (token) {
      fetchRecommendation();
    }
  }, [token]);

  // Handle feedback submission (like or dislike)
  const submitFeedback = async (liked) => {
    if (!recommendation) return;

    try {
      await axios.post(
        'http://127.0.0.1:8000/feedback',
        { item_id: recommendation.clothing_id, liked }, // Send item_id and liked as JSON
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setFeedback(liked ? 'Liked!' : 'Disliked!');
      
      // Fetch a new recommendation after feedback is submitted
      setTimeout(() => {
        setFeedback(null);
        setRecommendation(null); // Reset recommendation
        fetchRecommendation(); // Fetch a new one
      }, 1500); // Delay for feedback effect
    } catch (error) {
      console.error('Error submitting feedback', error);
    }
  };

  // If no token exists, show login screen
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
          <a
            href={recommendation.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Product
          </a>
          <div>
            <button onClick={() => submitFeedback(true)}>Like</button>
            <button onClick={() => submitFeedback(false)}>Dislike</button>
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
            </div>
          ))}
        </div>
      ) : (
        <p>No saved items to show.</p>
      )}
    </div>
  );
}

export default App;
