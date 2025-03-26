import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const PlaidLink = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchLinkToken = async () => {
    if (!user) {
      setError('Please log in to connect your bank account.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const createLinkTokenFunction = httpsCallable(functions, 'createLinkToken');
      const result = await createLinkTokenFunction();
      const token = result.data.link_token;
      if (!token) throw new Error('No link token received from server');
      console.log('Link token fetched:', token); // Debug log
      setLinkToken(token);
    } catch (error) {
      console.error('Error fetching link token:', error);
      setError('Failed to initialize bank connection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch link token only when user is authenticated
  useEffect(() => {
    if (user) {
      fetchLinkToken();
    }
  }, [user]);

  // Only initialize usePlaidLink when linkToken is available
  const config = {
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      try {
        const exchangeTokenFunction = httpsCallable(functions, 'exchangeToken');
        const exchangeResult = await exchangeTokenFunction({ public_token: publicToken });

        const accessToken = exchangeResult.data.access_token;
        if (!accessToken) throw new Error('No access token received');

        const syncTransactionsFunction = httpsCallable(functions, 'syncTransactions');
        const syncResult = await syncTransactionsFunction({ access_token: accessToken });

        if (user) {
          await addDoc(collection(db, 'users', user.uid, 'plaid'), {
            institution: metadata.institution,
            accounts: metadata.accounts,
            access_token: accessToken,
            timestamp: serverTimestamp(),
          });
        }

        if (onSuccess) onSuccess();
        alert('Bank account connected successfully!');
      } catch (error) {
        console.error('Error during Plaid connection:', error);
        setError('Failed to connect bank account: ' + error.message);
      }
    },
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setError('Plaid Link exited: ' + err.error_message);
      }
    },
    onEvent: (eventName) => {
      console.log('Plaid Link event:', eventName);
    },
  };

  const { open, ready } = linkToken ? usePlaidLink(config) : { open: () => {}, ready: false };

  // Debug logs for linkToken and ready state
  useEffect(() => {
    console.log('Link token:', linkToken);
    console.log('Plaid Link ready:', ready);
  }, [linkToken, ready]);

  return (
    <div className="flex flex-col items-center">
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!user && <p className="text-gray-500 mb-2">Please log in to connect your bank account.</p>}
      {user && (
        <button
          onClick={() => open()}
          disabled={!ready || isLoading}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-opacity duration-300 ${
            !ready || isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
          }`}
        >
          {isLoading ? 'Connecting...' : 'Connect Bank Account'}
        </button>
      )}
    </div>
  );
};

export default PlaidLink;