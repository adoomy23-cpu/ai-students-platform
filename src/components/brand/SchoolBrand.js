import Image from "next/image";
import Link from "next/link";
import { platformIdentity } from "../../config/platform.mjs";

export default function SchoolBrand({ compact = false }) {
  return (
    <Link href="/" className={`school-brand${compact ? " school-brand-compact" : ""}`} aria-label="مدارس الفكر التربوية، منصة الذكاء الاصطناعي، الرئيسية">
      <Image
        src="/alfikr-school-logo.png" alt="شعار مدارس الفكر التربوية"
        width={754} height={438} unoptimized priority={!compact}
        className="school-logo"
      />
      <span className="school-brand-copy">
        <strong>{platformIdentity.name}</strong>
        <span>{platformIdentity.tagline}</span>
      </span>
    </Link>
  );
}
