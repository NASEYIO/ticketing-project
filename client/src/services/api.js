// FILE: src/services/api.js
import axios from 'axios';

const BASE_URL = 'https://ticketing-backend-v438.onrender.com/api';

// Helper function to extract token safely from localStorage
const getAuthHeader = () => {
  const allKeys = Object.keys(localStorage);
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');

  if (!token) {
    console.error(
      "🛑 HANDSHAKE FAULT: No token found in browser storage! Available storage keys are:",
      allKeys
    );
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};

export const api = {
  // Auth: login
  login: async ({ identifier, password }) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, { identifier, password });
      return response.data;
    } catch (error) {
      console.error("Login request failed:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Authentication failed. Check credentials.");
    }
  },

  // Auth: register
  register: async ({ name, email, phoneNumber, password, role }) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        name, email, phoneNumber, password, role
      });
      return response.data;
    } catch (error) {
      console.error("Register request failed:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Registration process rejected.");
    }
  },

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
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
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