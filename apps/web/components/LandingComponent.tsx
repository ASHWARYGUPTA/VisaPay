"use client";
import Button from "@repo/ui/Button";
import NavBar from "@repo/ui/Navbar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { ModeToggle } from "./mode-toggler";
import VisaCard from "@repo/ui/VisaCard";
const LandingComponent = () => {
  return (
    <>
      {/* <NavBar /> */}
      <div className="flex h-screen items-center justify-center">
        {/* <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card> */}
        <VisaCard />
      </div>
    </>
  );
};

export default LandingComponent;
