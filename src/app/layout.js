import "./globals.css";

export const metadata = {
  title: "منصة الذكاء الاصطناعي",
  description: "منصة تعليمية تفاعلية للذكاء الاصطناعي",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
