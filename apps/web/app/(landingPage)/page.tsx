"use client";
import Button from "@repo/ui/Button";
import MenuButton from "@repo/ui/MenuButton";
import VisaCreditCard from "@repo/ui/VisaCreditCard";
import VisaLogo from "@repo/ui/VisaLogo";
export default function LandingPage() {
  return (
    <>
      <VisaCreditCard />
      <div>
        Package UI Demo
        <Button>Click me</Button>
        <MenuButton f={() => {}} />
        <VisaCreditCard />
        <VisaLogo widthN={100} heightN={100} />
      </div>
    </>
  );
}
