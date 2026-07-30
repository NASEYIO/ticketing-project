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
      <div 
        style={{ 
          textAlign: "center", 
          padding: "60px 20px", 
          background: "var(--sol-card, #FFFFFF)", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)",
          maxWidth: "600px",
          margin: "40px auto"
        }}
      >
        <h3 style={{ color: "var(--text-h, #121212)", fontWeight: "700" }}>
          Your checkout session expired or is empty.
        </h3>
        <p style={{ color: "var(--text-subtle, #666666)", marginBottom: "24px" }}>
          Please select an event ticket first to proceed.
        </p>
        <Button onClick={() => navigate("/")} variant="primary">
          Browse Events
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        style={{ 
          maxWidth: "500px", 
          margin: "40px auto", 
          textAlign: "center", 
          background: "var(--sol-card, #FFFFFF)", 
          padding: "40px 30px", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
        }}
      >
        <h2 style={{ color: "var(--text-h, #121212)", fontWeight: "800", marginTop: 0 }}>
          Almost there! Account Needed
        </h2>
        <p style={{ color: "var(--text-subtle, #666666)", marginBottom: "30px", lineHeight: "1.5" }}>
          To secure your tickets and deliver your QR access passes, please log in or create an account below.
        </p>
        <Button onClick={() => navigate("/login")} fullWidth size="lg" variant="primary">
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
      {/* PAYMENT CARD */}
      <div 
        style={{ 
          background: "var(--sol-card, #FFFFFF)", 
          padding: "32px", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)", 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.4rem" }}>🔒</span>
          <h2 style={{ margin: 0, color: "var(--text-h, #121212)", fontWeight: "800" }}>
            Secure Payment
          </h2>
        </div>
        
        <p style={{ color: "var(--text-subtle, #666666)", fontSize: "0.9rem", marginBottom: "24px" }}>
          Logged in as <b style={{ color: "var(--text-h, #121212)" }}>{user.email}</b>
        </p>

        {checkoutError && (
          <div 
            style={{ 
              padding: "14px", 
              background: "rgba(166, 43, 30, 0.08)", 
              color: "var(--sol-red, #A62B1E)", 
              borderRadius: "10px", 
              marginBottom: "20px", 
              fontSize: "0.9rem", 
              border: "1px solid rgba(166, 43, 30, 0.2)" 
            }}
          >
            ⚠️ {checkoutError}
          </div>
        )}

        {paymentPrompt && (
          <div 
            style={{ 
              padding: "18px", 
              background: paymentPrompt.mode === "development" ? "rgba(247, 181, 0, 0.1)" : "rgba(247, 181, 0, 0.15)", 
              color: "var(--text-h, #121212)", 
              border: "1px solid var(--sol-yellow, #F7B500)", 
              borderRadius: "12px", 
              marginBottom: "24px", 
              fontSize: "0.92rem", 
              lineHeight: "1.5" 
            }}
          >
            <strong style={{ color: "var(--sol-yellow, #F7B500)" }}>
              {paymentPrompt.mode === "development" ? "⚡ Payment staged" : "📲 M-Pesa prompt sent"}
            </strong>
            <br />
            {paymentPrompt.message}
            {paymentPrompt.checkoutRequestId && (
              <span style={{ display: "block", marginTop: "6px", fontSize: "0.8rem", color: "var(--text-subtle, #666666)" }}>
                Checkout request: {paymentPrompt.checkoutRequestId}
              </span>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate("/buyer/tickets")}
              style={{ marginTop: "14px" }}
            >
              View My Tickets
            </Button>
          </div>
        )}

        <form onSubmit={triggerMpesaStkPush}>
          <div 
            style={{ 
              background: "rgba(247, 181, 0, 0.05)", 
              border: "1px solid var(--border, #E5E2DC)", 
              padding: "18px", 
              borderRadius: "12px", 
              marginBottom: "24px" 
            }}
          >
            <label 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                fontWeight: "700", 
                color: "var(--text-h, #121212)", 
                marginBottom: "8px", 
                fontSize: "0.95rem" 
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>📱</span> Lipa na M-Pesa
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., 0712345678"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px 14px", 
                boxSizing: "border-box", 
                borderRadius: "8px", 
                border: "1px solid var(--border, #E5E2DC)", 
                background: "var(--sol-card, #FFFFFF)",
                color: "var(--text-h, #121212)",
                fontSize: "1rem",
                outline: "none" 
              }}
            />
          </div>

          <Button
            type="submit"
            isLoading={processingPayment}
            loadingText="Sending M-Pesa prompt..."
            fullWidth
            size="lg"
            variant="primary"
          >
            Pay KES {cart.totalAmount?.toLocaleString()}
          </Button>
        </form>
      </div>

      {/* ORDER SUMMARY CARD */}
      <div 
        style={{ 
          background: "var(--sol-card, #FFFFFF)", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)", 
          overflow: "hidden", 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)" 
        }}
      >
        <EventPhoto photoUrl={cart.photoUrl} title={cart.eventTitle} height="180px" />

        <div style={{ padding: "28px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--text-h, #121212)", fontSize: "1.25rem", fontWeight: "800" }}>
            Order Summary
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle, #666666)" }}>Event</span>
              <b style={{ color: "var(--text-h, #121212)", textAlign: "right" }}>{cart.eventTitle}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle, #666666)" }}>Ticket Tier</span>
              <span style={{ color: "var(--text-h, #121212)", fontWeight: "600" }}>{cart.tierLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle, #666666)" }}>Quantity</span>
              <span style={{ color: "var(--text-h, #121212)", fontWeight: "600" }}>{cart.quantity} Ticket(s)</span>
            </div>
          </div>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px dashed var(--border, #E5E2DC)" }} />

          <div 
            style={{ 
              background: "rgba(247, 181, 0, 0.08)", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid rgba(247, 181, 0, 0.2)",
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}
          >
            <span style={{ fontWeight: "700", color: "var(--text-h, #121212)" }}>Amount Due</span>
            <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--sol-yellow, #F7B500)" }}>
              KES {cart.totalAmount?.toLocaleString()}
            </span>
          </div>

          <p style={{ marginTop: "20px", fontSize: "0.8rem", color: "var(--text-subtle, #666666)", textAlign: "center", margin: "20px 0 0 0" }}>
            🔒 Payments are processed securely via M-Pesa
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;