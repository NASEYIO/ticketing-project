// FILE: src/services/api.js
import axios from 'axios';

const BASE_URL = 'https://ticketing-backend-v438.onrender.com';

// Helper function to extract token safely from localStorage
const getAuthHeader = () => {
  // 🔹 DEBUG LOG: Let's see exactly what key names exist in your browser right now
  const allKeys = Object.keys(localStorage);
  const token = localStorage.getItem('token') || localStorage.getItem('jwt'); // 👈 Tries both common names

  if (!token) {
    console.error(
      "🛑 HANDSHAKE FAULT: No token found in browser storage! Available storage keys are:", 
      allKeys
    );
    return {};
  }

  // Double check formatting structure matches Express Expectation
  return { Authorization: `Bearer ${token}` };
};

export const api = {
  // 1. Fetch all events for your homepage search grid
  getEvents: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/events`);
      return response.data;
    } catch (error) {
      console.error("Error fetching event array grid records:", error);
      throw error;
    }
  },

  // 2. Fetch specific single event data along with its nested ticket tiers
  getEventDetails: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching detail configuration for event ID ${id}:`, error);
      throw error;
    }
  },

  // 3. Fire your passkey-free M-Pesa STK push checkout payload to the database
  initiateCheckout: async ({ tierId, quantity, phoneNumber }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payments/checkout`,
        { tierId, quantity, phoneNumber },
        { headers: getAuthHeader() } // Passes the active user session securely
      );
      return response.data;
    } catch (error) {
      // Safely bubble up server error messages (like 'Invalid Password' or balance failures)
      console.error("Checkout transaction initialization rejected:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "M-Pesa Checkout transmission failed.");
    }
  },

  // 4. Retrieve real active tickets stored inside PostgreSQL for this specific profile
  getMyTickets: async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tickets/my-tickets`, 
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Wallet data download failure:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "Could not retrieve secure tickets.");
    }
  }
};