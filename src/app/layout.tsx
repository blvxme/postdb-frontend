import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" theme="light" richColors />
        {children}
      </body>
    </html>
  );
}
