"use client";

import { usePathname } from "next/navigation";
import NavBarLanding from "./pages/Landing/NavBarLanding";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on dashboard and other protected routes
  const hideNavbar = pathname?.startsWith("/dashboard");

  if (hideNavbar) {
    return null;
  }

  return <NavBarLanding />;
}
