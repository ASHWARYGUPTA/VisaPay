"use client";
import NavBar from "@repo/ui/Navbar";
import { ModeToggle } from "../../mode-toggler";

import { useRouter } from "next/navigation";

export default function NavBarLanding() {
  const router = useRouter();

  return (
    <NavBar
      moodChanger={ModeToggle}
      functionButton1={() => {
        router.push("/signin");
      }}
      functionButton2={() => {
        router.push("/signup");
      }}
    />
  );
}
