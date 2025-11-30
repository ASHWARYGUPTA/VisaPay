"use client";
import { Button } from "@repo/ui/components/ui/button";
import VisaCard from "@repo/ui/VisaCard";
import { Inter, Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["200", "400", "700"] });

const LandingComponent = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen items-center justify-center md:mt-[35px] px-4">
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
          className={`text-center text-[15px] my-2 w-[300px] md:w-fit md:my-2 md:text-[36px] md:drop-shadow-[0_35px_55px_rgba(0,0,0,0.45)] font-extralight ${poppins.className}`}
        >
          Connecting just about everyone to just about everyone else
        </div>
        <VisaCard />
        <div className="mt-2 md:mt-5 flex flex-col md:flex-row gap-4">
          <Button
            onClick={handleGetStarted}
            className="md:h-[50px] md:text-xl w-fit bg-[#1451CB] hover:bg-[#1451CB]/90 rounded-full text-white px-8"
          >
            {session ? "Go to Dashboard" : "Get Started"}
          </Button>
          {!session && (
            <Button
              onClick={() => router.push("/signin")}
              variant="outline"
              className="md:h-[50px] md:text-xl w-fit rounded-full px-8"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default LandingComponent;
