import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  return (
    // 1. Outer flex: Keeps sidebar and content side-by-side
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar: Fixed width, never shrinks */}
      <div style={{ width: "250px", flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* 2. Inner flex: The magic that perfectly centers your content */}
      <div
        style={{
          flex: 1,                  // Takes up the remaining width
          display: "flex",          // Enables flexbox for centering
          justifyContent: "center", // Centers horizontally
          padding: "20px",          // Gives breathing room on edges
        }}
      >
        {/* 3. Content container: Controls max width for readability */}
        <div style={{ width: "100%", maxWidth: "900px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;