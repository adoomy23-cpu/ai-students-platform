import { createElement as h } from "react";
const paths = {
  book: ["M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z", "M20 4h-4a3 3 0 0 0-3 3", "M20 4v14h-3"],
  rocket: ["M14 4c3-1 5-1 6-1 0 2 0 5-2 8l-7 7-5-5z", "M14 4H7l-4 5 5 1", "M18 11v6l-5 4-1-5", "M5 17l-2 4 4-2"],
  spark: ["m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"],
  arrow: ["M20 12H4", "m10 6-6 6 6 6"],
  trophy: ["M8 3h8v6a4 4 0 0 1-8 0z", "M8 5H4v3a4 4 0 0 0 4 4", "M16 5h4v3a4 4 0 0 1-4 4", "M12 13v7", "M7 21h10"],
  check: ["m5 12 4 4L19 6"], shield: ["m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z", "m8 12 3 3 5-6"],
  play: ["m9 5 11 7-11 7z"], menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  pencil: ["m4 16 12-12 4 4-12 12-5 1z", "m13 7 4 4"],
};
export default function Icon({ name, className = "", ...props }) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", className, ...props },
    ...(paths[name] || paths.spark).map((d, index) => h("path", { key: index, d })));
}
