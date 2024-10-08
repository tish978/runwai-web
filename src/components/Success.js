import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

function Success() {
  const [searchParams] = useSearchParams();
  const [sessionDetails, setSessionDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract the session_id from the URL
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Call your backend to retrieve session details
      axios.get(`http://127.0.0.1:8000/stripe-session/${sessionId}`)
        .then((response) => {
          setSessionDetails(response.data);
        })
        .catch((error) => {
          console.error('Error fetching session details:', error);
          setErrorMessage('Failed to retrieve session details. Please try again.');
        });
    }
  }, [sessionId]);

  return (
    <div>
      <h2>Payment Success!</h2>
      {errorMessage && <p>{errorMessage}</p>}
      {sessionDetails ? (
        <div>
          <p>Thank you for your purchase! Your session ID is: {sessionDetails.id}</p>
          <p>Amount Paid: ${sessionDetails.amount_total / 100}</p>
          <a href="/digital-closet">Go to your Digital Closet</a> {/* Link to Digital Closet */}
        </div>
      ) : (
        <p>Loading payment details...</p>
      )}
    </div>
  );
}

export default Success;
