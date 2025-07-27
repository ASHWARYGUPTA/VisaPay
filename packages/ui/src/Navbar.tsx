"use client";
import React, { JSX, ReactElement, ReactHTMLElement, useState } from "react";
import MenuButton from "./MenuButton";
import VisaLogo from "./VisaLogo";
import { Button } from "./components/ui/button";

interface NavBarExtras {
  moodChanger?: React.ElementType;
  functionButton1: () => void;
  functionButton2: () => void;
}

export default function NavBar({
  moodChanger,
  functionButton1,
  functionButton2,
}: NavBarExtras) {
  const [p, useP] = useState(false);
  return (
    <>
      <div className="h-auto mt-2 w-svw mx-1 bg-[#ffffff7e] rounded-xl fixed top-0 left-0">
        <div className=" h-[65px]   flex items-center justify-between font-poppins ">
          <div>
            <div className="pt-[120px] sm:hidden">
              <VisaLogo heightN={100} widthN={100} />
            </div>
            <div className="invisible sm:visible">
              <VisaLogo heightN={120} widthN={120} />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="mr-[20px]">
              {moodChanger ? React.createElement(moodChanger) : null}
            </div>
            <div className="invisible sm:visible flex justify-between items-center mr-3">
              {/* <Button>Sign In</Button>
              <Button>Sign Up</Button> */}
              <Button
                className="h-[45px] w-[100px] rounded-3xl text-[17px] mr-1 bg-[#1451CB]"
                onClick={functionButton1}
              >
                Sign In
              </Button>
              <Button
                className="h-[45px] w-[100px] rounded-3xl text-[17px] mr-1 bg-[#F3C851]"
                onClick={functionButton2}
              >
                Sign Up
              </Button>
            </div>
            <div className="absolute right-4  sm:hidden">
              <MenuButton
                f={() => {
                  useP((p) => !p);
                }}
              />
            </div>
          </div>
        </div>
        <div className={`mt-2 ${!p ? "hidden" : ""} `}>
          <Button>Sign In</Button>
          <Button>Sign up</Button>
        </div>
      </div>
    </>
  );
}
