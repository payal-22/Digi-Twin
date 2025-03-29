import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Robust environment variable validation
const validateEnvVar = (varName) => {
  const value = import.meta.env[varName];
  if (!value) {
    console.error(`Environment variable ${varName} is not set`);
    return null;
  }
  return value;
};

// Validate critical Plaid environment variables
const PLAID_CLIENT_ID = validateEnvVar('VITE_PLAID_CLIENT_ID');
const PLAID_SECRET = validateEnvVar('VITE_PLAID_SECRET');

// Fallback to sandbox if no environment specified
const plaidEnvironment = import.meta.env.VITE_PLAID_ENV || 'sandbox';

// Only create configuration if both client ID and secret are present
const configuration = PLAID_CLIENT_ID && PLAID_SECRET ? new Configuration({
  basePath: PlaidEnvironments[plaidEnvironment],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
}) : null;

// Create Plaid client only if configuration is valid
const plaidClient = configuration ? new PlaidApi(configuration) : null;
const db = getFirestore();

export const plaidService = {
  async createLinkToken(userId) {
    // Validate Plaid client and user ID
    if (!plaidClient) {
      throw new Error('Plaid client not initialized. Check environment variables.');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Expense Tracker',
        products: ['transactions','auth'],
        country_codes: ['US'],
        language: 'en',
        access_version: 'v1',
      });

      if (!response.data.link_token) {
        throw new Error('No link token received from Plaid');
      }

      return response.data.link_token;
    } catch (error) {
      console.error('Detailed Plaid Link Token Error:', error.response ? error.response.data : error);
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  },

  async exchangePublicToken(publicToken) {
    // Validate Plaid client
    if (!plaidClient) {
      throw new Error('Plaid client not initialized. Check environment variables.');
    }

    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const auth = getAuth();
      await addDoc(collection(db, 'plaidTokens'), {
        userId: auth.currentUser.uid,
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
        institutionId: response.data.institution_id,
        createdAt: new Date()
      });

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
      };
    } catch (error) {
      console.error('Token Exchange Error:', error);
      throw error;
    }
  },

  async saveTransactionsToFirestore(transactions) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
  
    const batch = writeBatch(db);
    
    transactions.forEach(transaction => {
      const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
      batch.set(transactionRef, {
        ...transaction,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    });
  
    await batch.commit();
  },
  
  async fetchTransactions(accessToken, daysBack = 30) {
    // Validate Plaid client
    if (!plaidClient) {
      throw new Error('Plaid client not initialized. Check environment variables.');
    }

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
  
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true
        }
      });
  
      return response.data.transactions.map(transaction => ({
        id: transaction.transaction_id,
        name: transaction.merchant_name || transaction.name,
        amount: transaction.amount,
        date: transaction.date,
        category: transaction.personal_finance_category?.primary || 'Uncategorized',
        account_id: transaction.account_id
      }));
    } catch (error) {
      console.error('Fetch Transactions Error:', error);
      throw error;
    }
  }
};