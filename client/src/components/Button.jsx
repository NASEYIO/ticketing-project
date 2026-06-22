// FILE: src/components/Button.jsx
import React from "react";

const VARIANTS = {
  primary: {
    background: "#2563eb",
    color: "white",
    border: "1px solid transparent",
    hover: "#1d4ed8",
  },

  secondary: {
    background: "white",
    color: "#475569",
    border: "1px solid #cbd5e1",
    hover: "#f8fafc",
  },

  danger: {
    background: "#dc2626",
    color: "white",
    border: "1px solid transparent",
    hover: "#b91c1c",
  },

  success: {
    background: "#10b981",
    color: "white",
    border: "1px solid transparent",
    hover: "#059669",
  }
};


const SIZES = {
  sm: {
    padding: "6px 12px",
    fontSize: "0.85rem",
    borderRadius: "6px"
  },

  md: {
    padding: "10px 20px",
    fontSize: "0.95rem",
    borderRadius: "8px"
  },

  lg: {
    padding: "14px 28px",
    fontSize: "1.05rem",
    borderRadius: "10px"
  }
};


function Button({
  as: Component = "button",
  children,
  variant="primary",
  size="md",
  isLoading=false,
  loadingText="Loading...",
  disabled=false,
  fullWidth=false,
  style={},
  ...props
}) {

  const currentVariant = VARIANTS[variant] || VARIANTS.primary;
  const currentSize = SIZES[size] || SIZES.md;


  const buttonStyle = {
    display:"inline-flex",
    alignItems:"center",
    justifyContent:"center",
    gap:"8px",

    fontWeight:"600",

    cursor:
      disabled || isLoading
      ? "not-allowed"
      : "pointer",

    opacity:
      disabled || isLoading
      ? 0.6
      : 1,

    width:
      fullWidth
      ? "100%"
      : "auto",

    transition:"0.2s ease",

    ...currentVariant,
    ...currentSize,
    ...style
  };


  return (
    <Component
      {...props}
      {...(Component === "button" ? { disabled: disabled || isLoading } : {})}
      style={buttonStyle}
    >

      {
        isLoading
        ?
        <>
          <span
            style={{
              width:"16px",
              height:"16px",
              border:"2px solid currentColor",
              borderTopColor:"transparent",
              borderRadius:"50%",
              display:"inline-block",
              animation:"spin 0.8s linear infinite"
            }}
          />

          {loadingText}
        </>

        :

        children
      }

    </Component>
  );
}


export default Button;
