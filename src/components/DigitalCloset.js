import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DigitalCloset() {
  const [purchasedItems, setPurchasedItems] = useState([]);
  const token = localStorage.getItem('token');  // Assuming you're storing the token in localStorage

  useEffect(() => {
    const fetchPurchasedItems = async () => {
        try {
          const response = await axios.get('http://127.0.0.1:8000/digital-closet', {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,  // Ensure this is set to true for CORS requests with cookies
          });
          setPurchasedItems(response.data);
        } catch (error) {
          console.error('Error fetching purchased items:', error);
        }
      };
      
  
    if (token) {
      fetchPurchasedItems();
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

export default DigitalCloset;
