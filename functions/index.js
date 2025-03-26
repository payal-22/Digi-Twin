const functions = require('firebase-functions');
const { Configuration, PlaidApi, PlaidEnvironments } = require('@plaid/plaid');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': '67d160ede07a95001f6825f7',
      'PLAID-SECRET': '77795cffb7011394ad80623e557e17',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

exports.createLinkToken = functions.https.onCall((_data, context) => {
    return cors(_data, context, async () => {
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }
      try {
        const response = await plaidClient.linkTokenCreate({
          user: { client_user_id: context.auth.uid },
          client_name: 'DigiTwin',
          products: ['transactions'],
          country_codes: ['US'],
          language: 'en',
        });
        return { link_token: response.data.link_token };
      } catch (error) {
        console.error('Error creating link token:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create link token');
      }
    });
  });

exports.exchangeToken = functions.https.onCall((_data, context) => {
  return cors(_data, context, async () => {
    try {
      const { public_token } = _data;
      const response = await plaidClient.itemPublicTokenExchange({
        public_token,
      });
      return { access_token: response.data.access_token };
    } catch (error) {
      console.error('Error exchanging token:', error);
      throw new functions.https.HttpsError('internal', 'Failed to exchange token');
    }
  });
});

exports.syncTransactions = functions.https.onCall((_data, context) => {
  return cors(_data, context, async () => {
    const { access_token } = _data;
    const userId = context.auth.uid;

    try {
      const response = await plaidClient.transactionsGet({
        access_token,
        start_date: '2023-01-01',
        end_date: new Date().toISOString().split('T')[0],
        options: { count: 100, offset: 0 },
      });

      const transactions = response.data.transactions;
      const batch = admin.firestore().batch();
      const transactionsRef = admin.firestore().collection(`users/${userId}/transactions`);

      transactions.forEach((txn) => {
        const docRef = transactionsRef.doc(txn.transaction_id);
        batch.set(docRef, {
          name: txn.name,
          amount: txn.amount,
          date: new Date(txn.date),
          category: txn.category ? txn.category[0] : 'Other',
          userId: userId,
        });
      });

      await batch.commit();
      return { success: true, transactionCount: transactions.length };
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new functions.https.HttpsError('internal', 'Failed to sync transactions');
    }
  });
});