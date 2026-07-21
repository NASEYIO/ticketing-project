// FILE: src/pages/Register.jsx
import { useState } from "react";
import Button from "../components/Button";
import { api } from "../services/api";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

function Register({ setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER");
  const [error, setError] = useState("");
const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await api.register({ name, email, phoneNumber, password, role });

      localStorage.setItem("token", data.token);

      const base64Url = data.token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const parsedUser = JSON.parse(window.atob(base64));

      setUser(parsedUser);

      alert(`Welcome aboard, ${parsedUser.name}!`);

     if (returnTo) {
        navigate(decodeURIComponent(returnTo));
      } else if (parsedUser.role === "ORGANIZER") {
        navigate("/organizer/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "30px",
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
      }}
    >
      <h2 style={{ textAlign: "center" }}>Create VibePass Account</h2>
      <p style={{ textAlign: "center", color: "#64748b" }}>
        Enter your credentials to manage and secure your passes.
      </p>

      {error && (
        <p
          style={{
            color: "#b91c1c",
            background: "#fef2f2",
            padding: "10px",
            borderRadius: "6px"
          }}
        >
          ⚠️ {error}
        </p>
      )}

      <form
        onSubmit={handleRegisterSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />

        <input
          type="tel"
          required
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />

        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="BUYER">Ticket Buyer</option>
          <option value="ORGANIZER">Event Organizer</option>
        </select>

        <Button type="submit" size="lg" fullWidth>
          Register Account
        </Button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Already have an account?{" "}
        <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}

export default Register;