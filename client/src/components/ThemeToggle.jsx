import { useTheme } from "../context/ThemeContext";

/**
 * Pill-shaped theme toggle that lives in the header nav.
 * Uses only CSS variables so it always looks right in both gold themes.
 */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "5px 11px",
        borderRadius: "20px",
        border: "1px solid rgba(247, 181, 0, 0.45)",
        background: isDark
          ? "rgba(247, 181, 0, 0.14)"
          : "rgba(255, 255, 255, 0.12)",
        color: "var(--sol-yellow, #F7B500)",
        cursor: "pointer",
        fontSize: "0.78rem",
        fontWeight: "700",
        fontFamily: "var(--sans)",
        letterSpacing: "0.02em",
        transition: "background 0.25s ease, border-color 0.25s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {/* Sliding track */}
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          display: "inline-block",
          width: "30px",
          height: "17px",
          borderRadius: "9px",
          background: isDark
            ? "rgba(247, 181, 0, 0.35)"
            : "rgba(255, 255, 255, 0.30)",
          border: "1px solid rgba(247, 181, 0, 0.50)",
          flexShrink: 0,
          transition: "background 0.25s ease",
        }}
      >
        {/* Thumb */}
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: isDark ? "13px" : "2px",
            width: "11px",
            height: "11px",
            borderRadius: "50%",
            background: "var(--sol-yellow, #F7B500)",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        />
      </span>

      {/* Icon + label */}
      <span className="theme-toggle-label" style={{ lineHeight: 1 }}>
        {isDark ? "🌙 Dark" : "☀️ Light"}
      </span>
    </button>
  );
}

export default ThemeToggle;
