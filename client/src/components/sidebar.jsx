import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={sideStyle}>
      <h2>Ticket System</h2>

      <Link to="/">Home</Link>
      <br />

      <Link to="/tickets">Tickets</Link>
      <br />

      <Link to="/sellers">Sellers</Link>
      <br />

      <Link to="/admin">Admin</Link>
      <br />

      <Link to="/login">Login</Link>

    </div>
  );
}


const sideStyle = {
  width: "200px",
  height: "100vh",
  padding: "20px",
  background: "var(--bg, #FAF8F5)",
  color: "var(--text-h, #121212)",
  borderRight: "1px solid var(--border, #E5E2DC)",
  boxSizing: "border-box",
};


export default Sidebar;