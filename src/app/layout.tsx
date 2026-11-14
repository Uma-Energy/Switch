import type { Metadata } from "next";
import "./globals.css";

export const viewport = { themeColor: "#10b981" };

export const metadata: Metadata = {
  title: "Switch: rides, packages and food across Nigeria",
  description: "Request a ride, send a package or order food with upfront fares in naira.",
  applicationName: "Switch",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
