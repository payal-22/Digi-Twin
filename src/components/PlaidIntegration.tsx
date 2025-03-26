import { usePlaidLink } from 'react-plaid-link';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import React from 'react';

export default function PlaidIntegration() {
  const [user] = useAuthState(auth);
  const [linkToken, setLinkToken] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const createLinkToken = httpsCallable(functions, 'createLinkToken');
  const syncTransactions = httpsCallable(functions, 'syncTransactions');

  useEffect(() => {
    if (!user) return;
    
    createLinkToken()
      .then((result: any) => setLinkToken(result.data.linkToken))
      .catch(console.error);
  }, [user]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        await httpsCallable(functions, 'exchangeToken')({ publicToken });
        await syncTransactions({});
        // Refresh transactions
        const q = query(
          collection(db, 'users', user!.uid, 'transactions'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Plaid error:", error);
      }
    },
  });

  return (
    <div>
      <button onClick={() => open()} disabled={!ready || !user}>
        {user ? "Connect Bank Account" : "Please sign in first"}
      </button>

      <h3>Recent Transactions</h3>
      {transactions.map(txn => (
        <div key={txn.id}>
          {txn.name} - ${txn.amount?.toFixed(2)}
          <div>{txn.date?.toDate()?.toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}