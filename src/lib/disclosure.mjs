// Disclosure navigation uses normal links and Tab order, not ARIA menu widgets.
export function bindDisclosureDismissal(target, { contains, dismiss, restoreFocus }) {
  const key = (event) => {
    if (event.key === "Escape") { dismiss(); restoreFocus(); }
  };
  const pointer = (event) => { if (!contains(event.target)) dismiss(); };
  target.addEventListener("keydown", key);
  target.addEventListener("pointerdown", pointer);
  return () => { target.removeEventListener("keydown", key); target.removeEventListener("pointerdown", pointer); };
}
