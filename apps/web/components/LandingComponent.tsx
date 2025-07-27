"use client";
import { Button } from "@repo/ui/components/ui/button";
import VisaCard from "@repo/ui/VisaCard";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["200", "400", "700"] });

const LandingComponent = () => {
  return (
    <>
      <div className="flex flex-col h-screen items-center justify-center mt-[35px]">
        <div
          className={`w-[700px] text-center font-bold text-[70px] ${inter.className}`}
          style={{
            letterSpacing: "-0.07em",
            lineHeight: "98.5%",
          }}
        >
          Visa, a trusted leader in digital payments.
        </div>
        <div
          style={{
            letterSpacing: "0.02em",
          }}
          className={`my-2 text-[36px] ${poppins.className} font-extralight drop-shadow-[13px_13px_7.1px_rgba(0,0,0,0.25)]`}
        >
          Connecting just about everyone to just about everyone else
        </div>
        <VisaCard />
        <div className="mt-5">
          <Button className="h-[50px] text-xl w-fit bg-[#1451CB] rounded-full text-white">
            Tap To Pay With Visa
          </Button>
        </div>
      </div>
    </>
  );
};

export default LandingComponent;
