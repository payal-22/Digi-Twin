import * as functions from 'firebase-functions/v2'; // Note the /v2 import
import * as admin from 'firebase-admin';
import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';

// Initialize Firebase Admin
admin.initializeApp();

// Get environment variables (set via Firebase CLI or .env file)
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SANDBOX_SECRET;

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  throw new Error('Missing Plaid configuration in environment variables');
}

// Initialize Plaid Client
const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      }
    }
  })
);

// Updated function using v2 signature
export const createLinkToken = functions.https.onCall(
  async (request: functions.https.CallableRequest) => {
    
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'Authentication required'
      );
    }

    // Rest of your function implementation...
  }
);