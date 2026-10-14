import Link from "next/link";
import SchoolIcon from "../brand/SchoolIcon";

export function PageSurface({ children, className = "", ...props }) {
  return <main id="main-content" tabIndex={-1} {...props} className={`platform-page ${className}`}>{children}</main>;
}
function layoutStyle(style = {}) {
  // Appearance belongs to the shared component. Preserve the page's layout.
  return Object.fromEntries(Object.entries(style).filter(([key]) => !["background", "color", "border", "borderColor", "borderRadius", "boxShadow", "fontSize", "fontWeight"].includes(key)));
}
export function Button({ children, variant = "primary", icon, className = "", type = "button", style, ...props }) {
  return <button type={type} style={variant === "choice" || variant === "card" ? style : layoutStyle(style)} {...props} className={`ui-button ui-button-${variant} ${className}`}>{icon && <SchoolIcon name={icon} size={19} />}{children}</button>;
}
export function ActionLink({ children, variant = "primary", className = "", style, ...props }) {
  return <Link {...props} style={{ ...layoutStyle(style), display: "flex" }} className={`ui-button ui-button-${variant} ${className}`}>{children}</Link>;
}
export function Input({ className = "", ...props }) {
  return <input {...props} className={`ui-input ${className}`} />;
}
export function Select({ className = "", children, ...props }) {
  return <select {...props} className={`ui-input ui-select ${className}`}>{children}</select>;
}
export function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`ui-input ui-textarea ${className}`} />;
}
export function Card({ as: Tag = "section", className = "", children, ...props }) {
  return <Tag {...props} className={`ui-card ${className}`}>{children}</Tag>;
}
export function StatusBadge({ className = "", tone = "neutral", children, ...props }) {
  return <span {...props} className={`ui-badge ui-badge-${tone} ${className}`}>{children}</span>;
}
export function Feedback({ className = "", tone, children, role, style, ...props }) {
  const text = typeof children === "string" ? children.trim() : "";
  const resolvedTone = tone || (/^(تعذر|تعذّر|لم |حدث خطأ|بيانات الدخول|هذا الحساب)/.test(text) ? "error" : /^تم/.test(text) ? "success" : /^(اختر|اكتب|أجب)/.test(text) ? "warning" : "info");
  return <div {...props} style={layoutStyle(style)} className={`ui-feedback ui-feedback-${resolvedTone} ${className}`} role={role || (resolvedTone === "error" ? "alert" : "status")} aria-live={resolvedTone === "error" ? "assertive" : "polite"}>{children}</div>;
}
export function EmptyState({ className = "", children, loading = false, ...props }) {
  return <div {...props} role="status" className={`ui-empty ${className}`}><SchoolIcon name={loading ? "clock" : "compass"} size={28} /><div>{children}</div></div>;
}
export function DataTable({ className = "", children, ...props }) {
  return <table {...props} className={`ui-table ${className}`}>{children}</table>;
}
export function BackLink({ href, label }) {
  return <Link href={href} className="ui-back-link"><SchoolIcon name="chevron" size={19} className="ui-back-icon" />{label}</Link>;
}
