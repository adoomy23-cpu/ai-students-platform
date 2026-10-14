"use client";
import Link from "next/link";
import SchoolIcon from "./SchoolIcon";
import { isCurrentDestination } from "../../config/navigation.mjs";

export default function NavigationGroups({ groups, pathname, onSelect, onSignOut, signingOut = false }) {
  return groups.map((group) => <div className="platform-navigation-group" key={group.id}>
    <span className="platform-navigation-label">{group.label}</span>
    <ul className="platform-navigation-list">
      {group.links.map((item) => <li key={item.href || item.action}>
        {item.action === "signOut" ? <button className="platform-navigation-action" type="button" disabled={signingOut} onClick={() => { onSelect?.(); onSignOut(); }}>
          <SchoolIcon name={item.icon} size={19} /><span>{signingOut ? "جارٍ الخروج…" : item.label}</span>
        </button> : <Link href={item.href} aria-current={isCurrentDestination(item.href, pathname) ? "page" : undefined} onClick={() => onSelect?.()}>
          <SchoolIcon name={item.icon} size={19} className="platform-navigation-icon" /><span>{item.label}</span>
        </Link>}
      </li>)}
    </ul>
  </div>);
}
