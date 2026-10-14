import Image from "next/image";

// Teacher-managed remote URLs remain browser-loaded: no unrestricted server image proxy.
// Local images can use Next's optimizer. Explicit dimensions reserve space before loading.
export default function ContentImage({ src, alt, style, width = 1200, height = 800 }) {
  if (typeof src !== "string" || !src.trim()) return null;
  const isLocal = src.startsWith("/") && !src.startsWith("//");
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
      unoptimized={!isLocal}
      style={{ height: "auto", ...style }}
    />
  );
}
