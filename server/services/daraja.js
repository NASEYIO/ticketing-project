// FILE: src/services/daraja.js
import axios from 'axios';

// 1. Get the correct base domain depending on your environment setting
const GET_BASE_URL = () => {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

/**
 * Automatically requests a time-bound OAuth access token from Safaricom
 */
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  // Combine key and secret into a basic auth base64 hash string
  const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(
      `${GET_BASE_URL()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${authHeader}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Daraja Access Token Error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Safaricom endpoints.");
  }
}

/**
 * Initiates an M-Pesa Express STK Push to a buyer's mobile phone
 */
export async function initiateStkPush({ phoneNumber, amount, eventTitle }) {
  const token = await getAccessToken();
  
  // Format phone number to strictly match: 254XXXXXXXXX (No +, No leading 0)
  let cleanPhone = phoneNumber.replace(/[\s+]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.substring(1);
  }
  
  // Generate the required Safaricom timestamp format: YYYYMMDDHHMMSS
  const date = new Date();
  const timestamp = 
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  // Generate the password parameter hash
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Use CustomerBuyGoodsOnline if you have a Retail Till
    Amount: Math.round(amount), // Daraja accepts whole numbers
    PartyA: cleanPhone, 
    PartyB: shortcode,
    PhoneNumber: cleanPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: eventTitle.substring(0, 12), // Max 12 characters
    TransactionDesc: `Ticket payment for ${eventTitle}`
  };

  try {
    const response = await axios.post(
      `${GET_BASE_URL()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    // Returns CheckoutRequestID and MerchantRequestID back to trace against later
    return response.data;
  } catch (error) {
    console.error("❌ Daraja STK Push Core Dispatch Failure:", error.response?.data || error.message);
    throw new Error(error.response?.data?.CustomerMessage || "Could not complete connection to Safaricom system.");
  }
}