"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";

export default function BaseProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>{children}</SessionProvider>
      </ThemeProvider>
    </>
  );
}
