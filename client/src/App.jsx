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
    localStorage.removeItem("token");
    setUser(null);
    setCart(null);
    alert("Logged out successfully");
  };

  return (
    <Router>
      {/* Main wrapper: Enforces strict screen boundaries on mobile devices */}
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#f8fafc",
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100vw",       /* Prevents menu from making the page too wide */
          overflowX: "hidden",     /* Cuts off accidental horizontal screen scrolling */
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}
      >
        {/* HEADER: Stays at top */}
       <header
          style={{
            background: "#ffffff",
            padding: "12px 15px", 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 50,
            gap: "10px",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <div className="brand-block" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              to="/"
              className="brand-logo"
              style={{
                fontSize: "1.2rem", 
                fontWeight: "800",
                color: "#2563eb",
                textDecoration: "none",
                letterSpacing: "-0.05em",
              }}
            >
              🎫 VibePass
            </Link>
            <span
              className="location-badge"
              style={{
                background: "#f1f5f9",
                padding: "4px 8px",
                borderRadius: "20px",
                fontSize: "0.7rem",
                color: "#475569",
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
              gap: "8px",
              alignItems: "center",
              overflowX: "auto",
              maxWidth: "100%",
              paddingBottom: "4px",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <Button
              as={Link}
              to="/"
              variant="secondary"
              size="sm"
              className="nav-btn"
              style={{ textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Explore
            </Button>

            {!user && (
              <>
                <Link
                  to="/Login"
                  className="nav-link"
                  style={{
                    color: "#475569",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  Organize
                </Link>
                <Link
                  to="/Login"
                  className="nav-link"
                  style={{
                    color: "#475569",
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
                  style={{ textDecoration: "none", whiteSpace: "nowrap" }}
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
                    color: "#2563eb",
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
                    background: "#f59e0b",
                    color: "#1e293b",
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
                  style={{ textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Admin Panel
                </Button>
                <Button onClick={logout} variant="secondary" size="sm" className="nav-btn" style={{ whiteSpace: "nowrap" }}>
                  Logout
                </Button>
              </>
            )}
          </nav>
        </header>

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1, 
            display: "flex",
            justifyContent: "center", /* Horizontally centers content wrapper */
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
              <Route path="/register" element={<Register setUser={setUser} />} />
              <Route path="/buyer/tickets" element={<MyTickets user={user} />} />
              <Route path="/organizer/dashboard" element={<OrganizerDashboard user={user} />} />
              <Route path="/organizer/create" element={<CreateEvent user={user} />} />
              <Route path="/organizer/edit/:id" element={<EditEvent user={user} />} />
              <Route path="/admin" element={<AdminPanel user={user} />} />
              <Route path="/t/:ticketId" element={<TicketPass />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;