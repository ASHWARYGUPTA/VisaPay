"use client";
import { Button } from "@repo/ui/components/ui/button";
import VisaCard from "@repo/ui/VisaCard";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["200", "400", "700"] });

const LandingComponent = () => {
  return (
    <>
      <div className="flex flex-col h-screen items-center justify-center md:mt-[35px]">
        <div
          className={`text-[50px] md:w-[700px] text-center font-bold md:text-[70px] ${inter.className}`}
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
          className={`text-center text-[15px] my-2 w-[300px] md:w-fit md:my-2 md:text-[36px] md:drop-shadow-[0_35px_55px_rgba(0,0,0,0.45)] font-extralight ${poppins.className}  `}
        >
          Connecting just about everyone to just about everyone else
        </div>
        <VisaCard />
        <div className="mt-2 md:mt-5">
          <Button className="md:h-[50px] md:text-xl w-fit bg-[#1451CB] rounded-full text-white">
            Tap To Pay With Visa
          </Button>
        </div>
      </div>
    </>
  );
};

export default LandingComponent;
