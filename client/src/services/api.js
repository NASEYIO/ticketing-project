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
  // Organizer dashboard metrics
  getOrganizerMetrics: async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payments/organizer-metrics`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching organizer metrics:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Analytics generation error.");
    }
  },

  // Delete an event (organizer only)
  deleteEvent: async (eventId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/events/${eventId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting event:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not delete event.");
    }
  },
// Fetch event categories for the dropdown
  getCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/categories`);
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Create a new event (organizer only)
  createEvent: async (eventPayload) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/events`,
        eventPayload,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Event creation failed:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Failed to publish listing to database.");
    }
  },
  // 4. Retrieve real active tickets stored inside PostgreSQL for this specific profile
  getMyTickets: async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tickets/my-wallet`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Wallet data download failure:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "Could not retrieve secure tickets.");
    }
  }
  // ---------- ADMIN ----------
,
  getAdminUsers: async () => {
    try {
      const response = await axios.get
      (`${BASE_URL}/admin/users`, 
        { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error("Error fetching admin users:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not load users.");
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/admin/users/${userId}/role`,
        { role },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not update role.");
    }
  },

  toggleUserBan: async (userId, isBanned) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/admin/users/${userId}/ban`,
        { isBanned },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating ban status:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not update ban status.");
    }
  },

  getPendingEvents: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/admin/events/pending`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending events:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not load pending events.");
    }
  },

  approveEvent: async (eventId) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/admin/events/${eventId}/approve`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error approving event:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not approve event.");
    }
  },

  rejectEvent: async (eventId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/admin/events/${eventId}/reject`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting event:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not reject event.");
    }
  },

  getAdminOrders: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/admin/orders`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not load orders.");
    }
  },
deleteUser: async (userId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/admin/users/${userId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not delete user.");
    }
  },
  getAdminTickets: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/admin/tickets`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error("Error fetching tickets:", error.response?.data || error);
      throw new Error(error.response?.data?.error || "Could not load tickets.");
    }
  },
};