import { createElement as h } from "react";
import { schoolIcons } from "./school-icons.mjs";

export default function SchoolIcon({ name, size = 22, className = "", ...props }) {
  return h("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": "true", focusable: "false", className, ...props,
  }, ...(schoolIcons[name] || schoolIcons.spark).map(({ tag, attrs }, index) =>
    h(tag, { ...attrs, key: index })));
}
