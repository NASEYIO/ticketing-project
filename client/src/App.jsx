// FILE: src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EditEvent from "./pages/EditEvent.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import TicketPass from "./pages/TicketPass.jsx";
import Button from "./components/Button.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyTicket from "./pages/VerifyTicket.jsx";
import AcceptTransfer from "./pages/AcceptTransfer.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import GateScanner from "./pages/GateScanner.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const parsedProfile = JSON.parse(jsonPayload);
        setUser(parsedProfile);
      } catch (e) {
        console.error("Token decoding error:", e);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const logout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    localStorage.removeItem("token");
    setUser(null);
    setCart(null);
    alert("Logged out successfully");
  };

  return (
    <Router>
      {/* Main wrapper: Uses Sauti Sol theme dark/light background */}
      <div
        style={{
          fontFamily: "var(--sans)",
          background: "var(--bg)",
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          transition: "background 0.3s ease, color 0.3s ease"
        }}
      >
        {/* HEADER */}
        <header
          style={{
            background: "var(--header-bg)",
            padding: "12px 20px", 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            gap: "10px",
            width: "100%",
            boxSizing: "border-box",
            transition: "background 0.3s ease, border-color 0.3s ease"
          }}
        >
          <div className="brand-block" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              to="/"
              className="brand-logo"
              style={{
                fontSize: "1.25rem", 
                fontWeight: "800",
                color: "var(--sol-cream, #FAF8F5)",
                textDecoration: "none",
                letterSpacing: "-0.03em",
              }}
            >
              🎫 Vibe<span style={{ color: "var(--sol-yellow, #F7B500)" }}>Pass</span>
            </Link>
            <span
              className="location-badge"
              style={{
                background: "rgba(247, 181, 0, 0.15)",
                border: "1px solid rgba(247, 181, 0, 0.3)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.7rem",
                color: "var(--sol-yellow, #F7B500)",
                fontWeight: "600",
              }}
            >
              Nairobi, KE
            </span>
          </div>

          <nav
            className="main-nav"
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              overflowX: "auto",
              maxWidth: "100%",
              paddingBottom: "4px",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <Link
              to="/"
              style={{
                color: "var(--sol-cream, #FAF8F5)",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "0.85rem",
                whiteSpace: "nowrap"
              }}
            >
              Explore
            </Link>

            <Link
              to="/verify"
              style={{
                color: "var(--sol-cream, #FAF8F5)",
                textDecoration: "none",
                fontWeight: "500",
                fontSize: "0.85rem",
                whiteSpace: "nowrap"
              }}
            >
              Verify Ticket
            </Link>

            {!user && (
              <>
                <Link
                  to="/login"
                  className="nav-link"
                  style={{
                    color: "var(--sol-cream, #FAF8F5)",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  Organize
                </Link>
                <Link
                  to="/login"
                  className="nav-link"
                  style={{
                    color: "var(--sol-cream, #FAF8F5)",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  Sign In
                </Link>
                <Button
                  as={Link}
                  to="/register"
                  size="sm"
                  className="nav-btn"
                  style={{
                    background: "var(--sol-yellow, #F7B500)",
                    color: "var(--sol-black, #121212)",
                    fontWeight: "700",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    border: "none",
                    borderRadius: "8px"
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}

            {user && user.role === "BUYER" && (
              <>
                <Link
                  to="/buyer/tickets"
                  className="nav-link"
                  style={{
                    color: "var(--sol-yellow, #F7B500)",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  🎟️ Tickets
                </Link>
                <Button onClick={logout} variant="secondary" size="sm" className="nav-btn" style={{ whiteSpace: "nowrap" }}>
                  Logout
                </Button>
              </>
            )}

            {user && user.role === "ORGANIZER" && (
              <>
                <Button
                  as={Link}
                  to="/organizer/dashboard"
                  variant="secondary"
                  size="sm"
                  className="nav-btn"
                  style={{
                    background: "var(--sol-yellow, #F7B500)",
                    color: "var(--sol-black, #121212)",
                    fontWeight: "700",
                    borderColor: "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  Dashboard
                </Button>
                <Button onClick={logout} variant="secondary" size="sm" className="nav-btn" style={{ whiteSpace: "nowrap" }}>
                  Logout
                </Button>
              </>
            )}

            {user && user.role === "ADMIN" && (
              <>
                <Button
                  as={Link}
                  to="/admin"
                  variant="danger"
                  size="sm"
                  className="nav-btn"
                  style={{
                    background: "var(--sol-red, #A62B1E)",
                    color: "#ffffff",
                    textDecoration: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  Admin Panel
                </Button>
                <Button onClick={logout} variant="secondary" size="sm" className="nav-btn" style={{ whiteSpace: "nowrap" }}>
                  Logout
                </Button>
              </>
            )}

            {/* ── Theme toggle ── always visible, rightmost nav item ── */}
            <ThemeToggle />
          </nav>
        </header>

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1, 
            display: "flex",
            justifyContent: "center",
            padding: "20px 12px", 
            width: "100%",
            boxSizing: "border-box", 
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1200px",
              boxSizing: "border-box"
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/event/:id" element={<EventDetails setCart={setCart} />} />
              <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} user={user} setUser={setUser} />} />
              <Route path="/login" element={<Login setUser={setUser} cart={cart} />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<Register setUser={setUser} />} />
              <Route path="/buyer/tickets" element={<MyTickets user={user} />} />
              <Route path="/organizer/dashboard" element={<OrganizerDashboard user={user} />} />
              <Route path="/organizer/create" element={<CreateEvent user={user} />} />
              <Route path="/organizer/edit/:id" element={<EditEvent user={user} />} />
              <Route path="/admin" element={<AdminPanel user={user} />} />
              <Route path="/t/:ticketId" element={<TicketPass />} />
              <Route path="/verify" element={<VerifyTicket />} />
              <Route path="/accept-transfer" element={<AcceptTransfer user={user} />} />
              <Route path="/terms" element={<TermsOfService />} />
             
             <Route path="/privacy" element={<PrivacyPolicy />} />
           <Route path="/organizer/scan/:eventId" element={<GateScanner user={user} />} />

            </Routes>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{ textAlign: "center", padding: "24px 20px", color: "var(--text)", fontSize: "0.85rem", borderTop: "1px solid var(--border)" }}>
          <Link to="/terms" style={{ color: "var(--text)", marginRight: "16px", textDecoration: "none" }}>Terms of Service</Link>
          <Link to="/privacy" style={{ color: "var(--text)", textDecoration: "none" }}>Privacy Policy</Link>
        </footer>
      </div>
    </Router>
  );
}

export default App;