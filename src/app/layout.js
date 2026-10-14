import "./globals.css";
import "./home.css";
import "../styles/platform.css";
import PlatformShell from "../components/platform/PlatformShell";

export const metadata = {
  title: "منصة الذكاء الاصطناعي",
  description: "تعلّم وجرّب وابتكر: منصة عربية للذكاء الاصطناعي لطلاب المرحلة الابتدائية، تضم المحتوى التعليمي والاختبارات والتحديات.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body><PlatformShell>{children}</PlatformShell></body>
    </html>
  );
}

