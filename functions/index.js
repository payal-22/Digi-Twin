require("dotenv").config(); // Load environment variables

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Setu API Credentials
const SETU_BASE_URL = "https://bridge.setu.co/v2/api/upi/transactions";
const SETU_API_KEY = process.env.SETU_API_KEY; // Fetch from .env file

// Cloud Function to fetch transactions
exports.getMockTransactions = functions.https.onRequest(async (req, res) => {
  try {
    const response = await axios.get(SETU_BASE_URL, {
      headers: {
        "x-api-key": SETU_API_KEY,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
