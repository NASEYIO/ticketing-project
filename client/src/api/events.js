const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/api/events`);
  return res.json();
}