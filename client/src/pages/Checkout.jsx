// FILE: src/pages/Checkout.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import EventPhoto from "../components/EventPhoto";

function Checkout({ cart, user }) {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentPrompt, setPaymentPrompt] = useState(null);

  if (!cart) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>Your checkout session expired or is empty. Please select an event first.</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", background: "white", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h2>Almost there! Account Needed</h2>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>To secure your tickets and deliver your QR access passes, please log in instantly below.</p>
        <Button onClick={() => navigate("/login")} fullWidth size="lg">
          Sign In / Create Account to Finish Payment
        </Button>
      </div>
    );
  }

  const triggerMpesaStkPush = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    setCheckoutError("");
    setPaymentPrompt(null);

    try {
      const result = await api.initiateCheckout({
        tierId: cart.tierId,
        quantity: cart.quantity,
        phoneNumber: phoneNumber.trim()
      });

      setPaymentPrompt({
        message: result.message || "Check your phone and enter your M-Pesa PIN to complete payment.",
        mode: result.mode,
        checkoutRequestId: result.checkoutRequestId
      });
    } catch (err) {
      setCheckoutError(err.message || "M-Pesa STK push initialization failed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "30px", alignItems: "start" }}>
      {/* PAYMENT CARD */}
      <div style={{ background: "white", padding: "35px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.4rem" }}>🔒</span>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Secure Payment</h2>
        </div>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "25px" }}>
          Logged in as <b style={{ color: "#334155" }}>{user.email}</b>
        </p>

        {checkoutError && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "15px", fontSize: "0.9rem", border: "1px solid #fecaca" }}>
            ⚠️ {checkoutError}
          </div>
        )}

        {paymentPrompt && (
          <div style={{ padding: "16px", background: paymentPrompt.mode === "development" ? "#fffbeb" : "#eff6ff", color: paymentPrompt.mode === "development" ? "#92400e" : "#1e40af", border: `1px solid ${paymentPrompt.mode === "development" ? "#fde68a" : "#bfdbfe"}`, borderRadius: "10px", marginBottom: "20px", fontSize: "0.92rem", lineHeight: "1.5" }}>
            <strong>{paymentPrompt.mode === "development" ? "Payment staged" : "📲 M-Pesa prompt sent"}</strong>
            <br />
            {paymentPrompt.message}
            {paymentPrompt.checkoutRequestId && (
              <span style={{ display: "block", marginTop: "6px", fontSize: "0.8rem", opacity: 0.75 }}>
                Checkout request: {paymentPrompt.checkoutRequestId}
              </span>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => navigate("/buyer/tickets")}
              style={{ marginTop: "14px" }}
            >
              View My Tickets
            </Button>
          </div>
        )}

        <form onSubmit={triggerMpesaStkPush}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "10px", marginBottom: "22px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#166534", marginBottom: "8px", fontSize: "0.95rem" }}>
              <span style={{ fontSize: "1.1rem" }}>📱</span> Lipa na M-Pesa
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., 0712345678"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
            />
          </div>

          <Button
            type="submit"
            isLoading={processingPayment}
            loadingText="Sending M-Pesa prompt..."
            fullWidth
            size="lg"
          >
            Pay KES {cart.totalAmount?.toLocaleString()}
          </Button>
        </form>
      </div>

      {/* ORDER SUMMARY CARD */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
       <EventPhoto photoUrl={cart.photoUrl} title={cart.eventTitle} height="180px" />
       

        <div style={{ padding: "30px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "18px", color: "#0f172a" }}>Order Summary</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Event</span>
              <b style={{ color: "#0f172a", textAlign: "right" }}>{cart.eventTitle}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Ticket Tier</span>
              <span style={{ color: "#334155" }}>{cart.tierLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Quantity</span>
              <span style={{ color: "#334155" }}>{cart.quantity} Ticket(s)</span>
            </div>
          </div>

          <hr style={{ margin: "22px 0", border: "none", borderTop: "1px dashed #cbd5e1" }} />

          <div style={{ background: "#eff6ff", padding: "18px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600", color: "#1e40af" }}>Amount Due</span>
            <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "#2563eb" }}>
              KES {cart.totalAmount?.toLocaleString()}
            </span>
          </div>

          <p style={{ marginTop: "20px", fontSize: "0.8rem", color: "#94a3b8", textAlign: "center" }}>
            🔒 Payments are processed securely via M-Pesa
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;