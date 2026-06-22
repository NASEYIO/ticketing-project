// FILE: src/pages/Checkout.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";

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
      // 🛠️ ERROR MESSAGE EXTRACTION FIX
      setCheckoutError(err.message || "M-Pesa STK push initialization failed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
      <div style={{ background: "white", padding: "35px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h2>🔒 Secure Payment Gateway</h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "25px" }}>Logged in as: <b>{user.email}</b></p>
        
        {checkoutError && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "0.9rem" }}>
            ⚠️ {checkoutError}
          </div>
        )}

        {paymentPrompt && (
          <div style={{ padding: "14px", background: paymentPrompt.mode === "development" ? "#fffbeb" : "#ecfdf5", color: paymentPrompt.mode === "development" ? "#92400e" : "#166534", border: `1px solid ${paymentPrompt.mode === "development" ? "#fde68a" : "#bbf7d0"}`, borderRadius: "8px", marginBottom: "18px", fontSize: "0.92rem", lineHeight: "1.5" }}>
            <strong>{paymentPrompt.mode === "development" ? "Payment staged" : "M-Pesa prompt sent"}</strong>
            <br />
            {paymentPrompt.message}
            {paymentPrompt.checkoutRequestId && (
              <span style={{ display: "block", marginTop: "6px", fontSize: "0.8rem", opacity: 0.8 }}>
                Checkout request: {paymentPrompt.checkoutRequestId}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate("/buyer/tickets")}
              style={{ marginTop: "12px" }}
            >
              View My Tickets
            </Button>
          </div>
        )}

        <form onSubmit={triggerMpesaStkPush}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "bold", color: "#166534", marginBottom: "5px" }}>Lipa na M-Pesa (STK Push)</label>
            <input 
              type="tel" 
              required 
              placeholder="e.g., 0712345678" 
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <Button 
            type="submit" 
            isLoading={processingPayment}
            loadingText="Sending M-Pesa prompt..."
            variant="success"
            fullWidth
            size="lg"
          >
            Pay KES {cart.totalAmount?.toLocaleString()}
          </Button>
        </form>
      </div>

      <div style={{ background: "#f8fafc", padding: "35px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h3>Order Summary</h3>
        <hr style={{ margin: "15px 0", borderColor: "#cbd5e1" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span>Event:</span> <b>{cart.eventTitle}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span>Ticket Access Level:</span> <span>{cart.tierLabel}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span>Quantity:</span> <span>{cart.quantity} Ticket(s)</span>
        </div>
        <hr style={{ margin: "15px 0", borderColor: "#cbd5e1" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "bold" }}>
          <span>Amount Due:</span> <span style={{ color: "#2563eb" }}>KES {cart.totalAmount?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default Checkout;