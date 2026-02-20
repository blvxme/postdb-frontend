import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Toaster position="top-right" theme="light" richColors />
        {children}
      </body>
    </html>
  );
}
