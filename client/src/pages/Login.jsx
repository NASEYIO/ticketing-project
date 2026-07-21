// FILE: src/pages/Login.jsx
import { useState } from "react";
import Button from "../components/Button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { api } from "../services/api";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

function Login({ setUser, cart }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const handleIdentitySubmission = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await api.login({ identifier, password });

      localStorage.setItem("token", data.token);

      if (data.user && data.user.email) {
        localStorage.setItem("userEmail", data.user.email);
      }

      setUser(data.user);

     if (returnTo) {
        navigate(decodeURIComponent(returnTo));
      } else if (cart) {
        navigate("/checkout");
      } else {
        if (data.user?.role === "ORGANIZER") navigate("/organizer/dashboard");
        else if (data.user?.role === "ADMIN") navigate("/admin");
        else navigate("/");
      }
    } catch (err) {
      setErrorMessage(err.message || "Network connectivity failure detected.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px 0" }}>Sign In</h2>
      <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "30px" }}>Access ticket wallets, track sales inventory, or manage events</p>

      {errorMessage && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "20px", fontWeight: "500" }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleIdentitySubmission} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Email or Username</label>
          <input
            type="text"
            required
            disabled={isLoading}
            placeholder="Enter your email or username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Password</label>
           <Link to="/forgot-password" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>Forgot?</Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                paddingRight: "45px",
                boxSizing: "border-box",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "1rem"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "1.2rem",
                padding: "4px"
              }}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          size="lg"
          style={{ marginTop: "10px" }}
        >
          Continue
        </Button>
      </form>
    </div>
  );
}

export default Login;