// FILE: src/pages/AcceptTransfer.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../services/api";

function AcceptTransfer({ user }) {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("This link is missing a transfer code.");
      setIsLoading(false);
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    api.getTransferDetails(code)
      .then(setDetails)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [code, user]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await api.acceptTransfer(code);
      setSuccess(true);
      setTimeout(() => navigate("/buyer/tickets"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: "450px", margin: "60px auto", padding: "40px", textAlign: "center", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h3>Log In to Accept This Ticket</h3>
        <p style={{ color: "#64748b" }}>You need an account to receive this ticket transfer.</p>
        <Link to={`/login`} style={{ color: "#2563eb" }}>Sign in</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ padding: "60px", textAlign: "center" }}>Checking transfer link...</div>;
  }

  return (
    <div style={{ maxWidth: "450px", margin: "60px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <h2 style={{ marginTop: 0 }}>🎟️ Incoming Ticket Transfer</h2>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.9rem" }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "0.9rem" }}>
          ✅ Ticket accepted! Redirecting to your wallet...
        </div>
      )}

      {details && !success && (
        <>
          <p style={{ color: "#64748b" }}>
            <b>{details.fromName}</b> wants to transfer this ticket to you:
          </p>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "16px 0" }}>
            <p style={{ margin: "4px 0", fontWeight: "700" }}>{details.eventTitle}</p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#475569" }}>📍 {details.venue}</p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#475569" }}>📅 {new Date(details.date).toLocaleDateString("en-KE")}</p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#475569" }}>🎫 {details.tierName}</p>
          </div>
          <Button onClick={handleAccept} isLoading={isAccepting} size="lg" fullWidth>
            Accept This Ticket
          </Button>
        </>
      )}
    </div>
  );
}

export default AcceptTransfer;