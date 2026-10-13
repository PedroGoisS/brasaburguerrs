import type { ButtonHTMLAttributes } from "react";

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return <button type={type} className={`${variant === "primary" ? "btn" : "btn-ghost"} ${className}`} {...props} />;
}