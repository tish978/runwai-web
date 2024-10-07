import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Recommend({ token }) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        console.log("Fetching recommendation...");
        const response = await axios.get('http://127.0.0.1:8000/recommend', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Log the entire response for troubleshooting
        console.log("Full response:", response);

        if (response.data && response.data.recommended_item) {
          console.log("Setting item:", response.data.recommended_item);
          setItem(response.data.recommended_item);
        } else {
          console.log("No recommended item found in response.");
        }
      } catch (error) {
        console.error("Error fetching recommendation:", error);
      }
    };

    if (token) {
      fetchRecommendation();
    }
  }, [token]);

  const handleFeedback = async (liked) => {
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/feedback',
        { item_id: item.clothing_id, liked },  // Send as JSON
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'  // Specify JSON content type
          },
        }
      );
      alert(`You have ${liked ? 'liked' : 'disliked'} this item.`);
    } catch (error) {
      console.error(error);
      alert('Error submitting feedback.');
    }
  };

  const formatPrice = (price) => {
    // Ensure price is properly formatted with $ and avoid double $
    if (typeof price === 'string' && price.trim().startsWith('$')) {
      return price; // Already has $ sign
    }
    return `$${price}`;
  };

  return (
    <div>
      <h2>Recommended Item</h2>
      {item ? (
        <div>
          <h3>{item.item_name || "No item name available"}</h3>
          <p>Brand: {item.brand || "No brand available"}</p>
          <p>Category: {item.category || "No category available"}</p>
          <img src={item.image_url || "placeholder_image_url_here"} alt={item.item_name || "No image available"} />
          <p>Price: {item.price ? formatPrice(item.price) : "No price available"}</p>
          <a href={item.url || "#"} target="_blank" rel="noreferrer">View Product</a>
          <br />
          <button onClick={() => handleFeedback(true)}>Like</button>
          <button onClick={() => handleFeedback(false)}>Dislike</button>
        </div>
      ) : (
        <p>Loading recommendation...</p>
      )}
    </div>
  );
}

export default Recommend;
