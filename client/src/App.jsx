// FILE: src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTickets from "./pages/MyTickets";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEvent from "./pages/CreateEvent";
import AdminPanel from "./pages/AdminPanel";
import TicketPass from "./pages/TicketPass"; 
import Button from "./components/Button";

function App() {
  const [user, setUser] = useState(null); 
  const [cart, setCart] = useState(null); 

  useEffect(() => {
    // 🛠️ ALIGNMENT FIX: Updated session re-hydration targeting key "token"
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
        console.error("Token decoding error: cleaning corrupt security configurations", e);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const logout = () => {
    // 🛠️ ALIGNMENT FIX: Clean destruction using key "token"
    localStorage.removeItem("token"); 
    setUser(null);
    setCart(null); 
    alert("Logged out successfully");
  };

  return (
    <Router>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
        
        <header style={{ background: "#ffffff", padding: "15px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <Link to="/" style={{ fontSize: "1.6rem", fontWeight: "800", color: "#2563eb", textDecoration: "none", letterSpacing: "-0.05em" }}>🎫 VibePass</Link>
            <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>Nairobi, KE</span>
          </div>
          
          <nav style={{ display: "flex", gap: "25px", alignItems: "center" }}>
            <Button as={Link} to="/" variant="secondary" size="sm" style={{ textDecoration: "none" }}>Explore Events</Button>
            
            {!user && (
              <>
                <Link to="/login" style={{ color: "#475569", textDecoration: "none", fontWeight: "500" }}>Organize an Event</Link>
                <Link to="/login" style={{ color: "#475569", textDecoration: "none", fontWeight: "500" }}>Sign In</Link>
                <Button as={Link} to="/register" style={{ textDecoration: "none" }}>Sign Up</Button>
              </>
            )}

            {user && user.role === "BUYER" && (
              <>
                <Link to="/buyer/tickets" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>🎟️ My Tickets</Link>
                <Button onClick={logout} variant="secondary" size="sm">Logout ({user.name})</Button>
              </>
            )}

            {user && user.role === "ORGANIZER" && (
              <>
                <Button as={Link} to="/organizer/dashboard" variant="secondary" size="sm" style={{ background: "#f59e0b", color: "#1e293b", borderColor: "transparent", textDecoration: "none" }}>Dashboard</Button>
                <Button onClick={logout} variant="secondary" size="sm">Logout ({user.name || "Organizer"})</Button>
              </>
            )}

            {user && user.role === "ADMIN" && (
              <>
                <Button as={Link} to="/admin" variant="danger" size="sm" style={{ textDecoration: "none" }}>Admin Control Panel</Button>
                <Button onClick={logout} variant="secondary" size="sm">Logout</Button>
              </>
            )}
          </nav>
        </header>

        <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetails setCart={setCart} />} />
            <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} user={user} setUser={setUser} />} />
            
            <Route path="/login" element={<Login setUser={setUser} cart={cart} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            
            <Route path="/buyer/tickets" element={<MyTickets user={user} />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard user={user} />} />
            <Route path="/organizer/create" element={<CreateEvent user={user} />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            
            <Route path="/t/:ticketId" element={<TicketPass />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;