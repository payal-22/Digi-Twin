import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { plaidService } from '../services/plaidService';
import { auth } from '../firebase/firebase';

function PlaidLinkButton({onBankConnected}) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLinkToken() {
      try {
        setLoading(true);
        // Add extra validation for current user
        if (!auth.currentUser) {
          throw new Error('User not authenticated');
        }
        
        const currentUserId = auth.currentUser.uid;
        
        // Log environment variables for debugging
        console.log('Plaid Client ID:', import.meta.env.VITE_PLAID_CLIENT_ID);
        console.log('Plaid Environment:', import.meta.env.VITE_PLAID_ENV);

        const token = await plaidService.createLinkToken(currentUserId);
        setLinkToken(token);
      } catch (error) {
        console.error('Detailed Error Creating Link Token:', error);
        setError(`Failed to create link token: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    if (auth.currentUser) {
      fetchLinkToken();
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      try {
        // Exchange public token for access token
        const { accessToken } = await plaidService.exchangePublicToken(publicToken);
        
        // Fetch and store transactions
        const transactions = await plaidService.fetchTransactions(accessToken);
        await plaidService.saveTransactionsToFirestore(transactions);
        
        // Call the callback to update parent component
        onBankConnected && onBankConnected();
      } catch (error) {
        console.error('Plaid Link Error:', error);
        setError(`Failed to process bank connection: ${error.message}`);
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link Exit:', err);
        setError(`Plaid Link Exit: ${err.message}`);
      }
    }
  });

  if (loading) return <div>Loading Plaid Link...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <button 
      onClick={() => open()} 
      disabled={!ready}
      className="bg-blue-500 text-white px-4 py-2 rounded w-full"
    >
      Connect Bank Account
    </button>
  );
}

export default PlaidLinkButton;