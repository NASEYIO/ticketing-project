// FILE: src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await api.forgotPassword(email);
      setMessage(data.message || "If that email exists, a reset link has been sent.");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0" }}>Forgot Password</h2>
      <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "30px" }}>
        Enter your email and we'll send you a link to reset your password.
      </p>

      {message && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "20px" }}>
          ✅ {message}
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {!message && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Email</label>
            <input
              type="email"
              required
              disabled={isLoading}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
            />
          </div>

          <Button type="submit" isLoading={isLoading} size="lg">
            Send Reset Link
          </Button>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
        <Link to="/login" style={{ color: "#2563eb", textDecoration: "none" }}>Back to Sign In</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;