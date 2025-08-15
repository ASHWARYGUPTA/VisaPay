import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import NavBarLanding from "../components/pages/Landing/NavBarLanding";
import BaseProviders from "../components/providers/BaseProviders";
export const metadata: Metadata = {
  title: "VisaPay",
  description: "Secure Payment Platform For everyone",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <BaseProviders>
          <NavBarLanding />
          {children}
        </BaseProviders>
      </body>
    </html>
  );
}
